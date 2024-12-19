// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import type { Sort } from 'mongodb';
import type { User, PackBasic } from '@/types';

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
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
      // Search packs - include deleted ones but mark them
      const baseQuery = {
        $or: [
          { name: { $regex: searchRegex } },
          { creator: { $regex: searchRegex } }
        ]
      };

      const totalPacks = await db.collection('starter_packs')
        .countDocuments(baseQuery);

      const sortSpec = { [getPackSortField(sortBy)]: sortOrder } as Sort;

      const matchingPacks = await db.collection('starter_packs')
        .find(baseQuery)
        .project({
          rkey: 1,
          name: 1,
          creator: 1,
          creator_did: 1,
          description: 1,
          user_count: 1,
          users: 1,
          weekly_joins: 1,
          total_joins: 1,
          created_at: 1,
          deleted: 1,
          status: 1,
          last_known_state: 1
        })
        .sort(sortSpec)
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .toArray();

      const packsWithDetails = await Promise.all(
        matchingPacks.map(async (pack) => {
          // Get creator details
          const creator = await db.collection('users')
            .findOne(
              { did: pack.creator_did },
              {
                projection: {
                  did: 1,
                  handle: 1,
                  display_name: 1,
                  followers_count: 1,
                  deleted: 1
                }
              }
            );

          // If pack is deleted, use last known state
          const packData = pack.deleted ? {
            ...pack,
            name: pack.last_known_state?.name || pack.name,
            creator: pack.last_known_state?.creator || pack.creator
          } : pack;

          return {
            ...packData,
            creator_details: creator
          };
        })
      );

      return NextResponse.json({
        items: packsWithDetails,
        total: totalPacks,
        page,
        totalPages: Math.ceil(totalPacks / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
      });

    } else {
      // Search users
      const baseQuery = {
        $or: [
          { handle: { $regex: searchRegex } },
          { display_name: { $regex: searchRegex } }
        ]
      };

      const totalUsers = await db.collection('users')
        .countDocuments(baseQuery);

      const sortSpec = { [getUserSortField(sortBy)]: sortOrder } as Sort;

      const users = await db.collection('users')
        .find(baseQuery)
        .project({
          did: 1,
          handle: 1,
          display_name: 1,
          followers_count: 1,
          follows_count: 1,
          pack_ids: 1,
          created_packs: 1,
          deleted: 1
        })
        .sort(sortSpec)
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .toArray();

      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          // Get all packs where user is a member
          const memberPacks = user.pack_ids?.length ?
            await db.collection('starter_packs')
              .find({ rkey: { $in: user.pack_ids } })
              .project({
                rkey: 1,
                name: 1,
                creator: 1,
                creator_did: 1,
                user_count: 1,
                deleted: 1,
                status: 1,
                last_known_state: 1
              })
              .toArray() : [];

          // Get all packs created by user
          const createdPacks = await db.collection('starter_packs')
            .find({ creator_did: user.did })
            .project({
              rkey: 1,
              name: 1,
              creator: 1,
              creator_did: 1,
              user_count: 1,
              deleted: 1,
              status: 1,
              last_known_state: 1
            })
            .toArray();

          // Transform pack data to include deleted state
          const transformPacks = (packs: any[]): PackBasic[] => 
            packs.map(pack => ({
              rkey: pack.rkey,
              name: pack.deleted ? pack.last_known_state?.name || pack.name : pack.name,
              creator: pack.deleted ? pack.last_known_state?.creator || pack.creator : pack.creator,
              creator_did: pack.creator_did,
              user_count: pack.user_count,
              deleted: pack.deleted,
              status: pack.status
            }));

          return {
            did: user.did,
            handle: user.handle,
            display_name: user.display_name,
            followers_count: user.followers_count,
            follows_count: user.follows_count,
            member_packs: transformPacks(memberPacks),
            created_packs: transformPacks(createdPacks),
            deleted: user.deleted
          };
        })
      );

      return NextResponse.json({
        items: enhancedUsers,
        total: totalUsers,
        page,
        totalPages: Math.ceil(totalUsers / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
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

function getPackSortField(sortBy: string): string {
  switch (sortBy) {
    case 'name':
      return 'name';
    case 'members':
      return 'user_count';
    case 'activity':
      return 'weekly_joins';
    case 'created':
      return 'created_at';
    default:
      return 'name';
  }
}

function getUserSortField(sortBy: string): string {
  switch (sortBy) {
    case 'name':
      return 'display_name';
    case 'handle':
      return 'handle';
    case 'followers':
      return 'followers_count';
    default:
      return 'display_name';
  }
}