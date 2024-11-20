// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'packs';
    const page = parseInt(searchParams.get('page') || '1', 10);

    const sortBy = searchParams.get('sortBy') || '';
    const sortOrderParam = searchParams.get('sortOrder') || 'asc';
    const sortOrder = sortOrderParam === 'desc' ? -1 : 1;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('starterpacks');
    const searchRegex = new RegExp(query, 'i');
    const skip = (page - 1) * ITEMS_PER_PAGE;

    if (type === 'packs') {
      // Map sortBy to database fields for packs
      const sortField = getPackSortField(sortBy);

      // Get total count for pagination
      const totalPacks = await db.collection('starter_packs')
        .countDocuments({
          $or: [
            { name: { $regex: searchRegex } },
            { creator: { $regex: searchRegex } },
          ],
        });

      // Search packs with pagination and sorting   
      const matchingPacks = await db.collection('starter_packs')
        .find({
          $or: [
            { name: { $regex: searchRegex } },
            { creator: { $regex: searchRegex } },
          ],
        })
        .project({
          rkey: 1,
          name: 1,
          creator: 1,
          description: 1,
          user_count: 1,
          //use_count: 1, 
          users: 1,
        })
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .toArray();

      const packsWithUsers = await Promise.all(
        matchingPacks.map(async (pack) => {
          const packUsersArray: string[] = Array.isArray(pack.users) ? pack.users : [];

          const packUsers = await db.collection('users')
            .find({ did: { $in: packUsersArray } })
            .project({
              did: 1,
              handle: 1,
              display_name: 1,
            })
            .toArray();

          return {
            rkey: pack.rkey,
            name: pack.name,
            creator: pack.creator,
            description: pack.description,
            user_count: pack.user_count || packUsers.length,
            //use_count: pack.use_count || 0,
            users: packUsers,
          };
        })
      );

      return NextResponse.json({
        items: packsWithUsers,
        total: totalPacks,
        page,
        totalPages: Math.ceil(totalPacks / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE,
      });
    } else {
      // Map sortBy to database fields for users
      const sortField = getUserSortField(sortBy);

      // Get total count for pagination
      const totalUsers = await db.collection('users')
        .countDocuments({
          $or: [
            { handle: { $regex: searchRegex } },
            { display_name: { $regex: searchRegex } },
          ],
        });

      let users;
      if (sortField === 'pack_ids_count' || sortField === 'followers_count') {
        // Need to calculate pack_ids_count or ensure followers_count exists
        users = await db.collection('users')
          .aggregate([
            {
              $match: {
                $or: [
                  { handle: { $regex: searchRegex } },
                  { display_name: { $regex: searchRegex } },
                ],
              },
            },
            {
              $addFields: {
                pack_ids_count: { $size: { $ifNull: ['$pack_ids', []] } },
                followers_count: { $ifNull: ['$followers_count', 0] },
              },
            },
            {
              $sort: { [sortField]: sortOrder },
            },
            {
              $skip: skip,
            },
            {
              $limit: ITEMS_PER_PAGE,
            },
            {
              $project: {
                did: 1,
                handle: 1,
                display_name: 1,
                pack_ids: 1,
                pack_ids_count: 1,
                followers_count: 1,
              },
            },
          ])
          .toArray();
      } else {
        users = await db.collection('users')
          .find({
            $or: [
              { handle: { $regex: searchRegex } },
              { display_name: { $regex: searchRegex } },
            ],
          })
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(ITEMS_PER_PAGE)
          .project({
            did: 1,
            handle: 1,
            display_name: 1,
            pack_ids: 1,
            followers_count: 1,
          })
          .toArray();
      }

      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          if (!Array.isArray(user.pack_ids) || user.pack_ids.length === 0) {
            return {
              ...user,
              packs: [],
            };
          }

          const userPacks = await db.collection('starter_packs')
            .find({ rkey: { $in: user.pack_ids } })
            .project({
              rkey: 1,
              name: 1,
              creator: 1,
            })
            .toArray();

          return {
            ...user,
            packs: userPacks,
          };
        })
      );

      return NextResponse.json({
        items: enhancedUsers,
        total: totalUsers,
        page,
        totalPages: Math.ceil(totalUsers / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE,
      });
    }
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

// Helper function to map pack sort fields
function getPackSortField(sortBy: string): string {
  switch (sortBy) {
    case 'name':
      return 'name';
    //case 'uses':
    //  return 'use_count'; // Ensure this field exists in your collection
    case 'members':
      return 'user_count';
    default:
      return 'name'; // Default sorting
  }
}

// Helper function to map user sort fields
function getUserSortField(sortBy: string): string {
  switch (sortBy) {
    case 'name':
      return 'display_name';
    case 'followers':
      return 'followers_count'; // Ensure this field exists in your collection
    case 'packs':
      return 'pack_ids_count';
    default:
      return 'display_name'; // Default sorting
  }
}
