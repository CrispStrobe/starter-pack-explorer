// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import type { Sort } from 'mongodb';
import type { 
  StarterPack, 
  User, 
  EnhancedUser, 
  ApiResponse 
} from '@/types';

const ITEMS_PER_PAGE = 10;

// explicitly mark the route as dynamic
export const dynamic = 'force-dynamic';

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
        .find<Partial<StarterPack>>(baseQuery)
        .project({
          rkey: 1,
          name: 1,
          creator: 1,
          creator_did: 1,
          user_count: 1,
          description: 1,
          users: 1,
          weekly_joins: 1,
          total_joins: 1,
          created_at: 1,
          updated_at: 1,
          deleted: 1,
          deleted_at: 1,
          deletion_reason: 1,
          status: 1,
          status_updated_at: 1,
          status_reason: 1,
          last_updated: 1
        })
        .sort(sortSpec)
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .toArray();

      const packsWithDetails = await Promise.all(
        matchingPacks.map(async (pack): Promise<StarterPack> => {
          const creator = await db.collection('users')
            .findOne<User>(
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

          // Ensure all required properties are present
          const completePack: StarterPack = {
            rkey: pack.rkey!,
            name: pack.name!,
            creator: pack.creator!,
            creator_did: pack.creator_did!,
            user_count: pack.user_count!,
            description: pack.description,
            users: pack.users || [],
            created_at: pack.created_at || new Date().toISOString(),
            updated_at: pack.updated_at || new Date().toISOString(),
            weekly_joins: pack.weekly_joins || 0,
            total_joins: pack.total_joins || 0,
            deleted: pack.deleted,
            deleted_at: pack.deleted_at,
            deletion_reason: pack.deletion_reason,
            status: pack.status,
            status_updated_at: pack.status_updated_at,
            status_reason: pack.status_reason,
            last_updated: pack.last_updated || new Date().toISOString(),
            creator_details: creator || undefined
          };

          return completePack;
        })
      );

      const response: ApiResponse<StarterPack> = {
        items: packsWithDetails,
        total: totalPacks,
        page,
        totalPages: Math.ceil(totalPacks / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
      };

      return NextResponse.json(response);

    } else {
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
        .find<User>(baseQuery)
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
        users.map(async (user): Promise<EnhancedUser> => {
          const memberPacks = user.pack_ids?.length ?
            await db.collection('starter_packs')
              .find<StarterPack>({ rkey: { $in: user.pack_ids } })
              .project({
                rkey: 1,
                name: 1,
                creator: 1,
                creator_did: 1,
                user_count: 1,
                deleted: 1,
                status: 1
              })
              .toArray() : [];

          const createdPacks = await db.collection('starter_packs')
            .find<StarterPack>({ creator_did: user.did })
            .project({
              rkey: 1,
              name: 1,
              creator: 1,
              creator_did: 1,
              user_count: 1,
              deleted: 1,
              status: 1
            })
            .toArray();

          return {
            did: user.did,
            handle: user.handle,
            display_name: user.display_name,
            followers_count: user.followers_count,
            follows_count: user.follows_count,
            member_packs: memberPacks.map(pack => ({
              rkey: pack.rkey,
              name: pack.name,
              creator: pack.creator,
              creator_did: pack.creator_did,
              user_count: pack.user_count
            })),
            created_packs: createdPacks.map(pack => ({
              rkey: pack.rkey,
              name: pack.name,
              creator: pack.creator,
              creator_did: pack.creator_did,
              user_count: pack.user_count
            }))
          };
        })
      );

      const response: ApiResponse<EnhancedUser> = {
        items: enhancedUsers,
        total: totalUsers,
        page,
        totalPages: Math.ceil(totalUsers / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
      };

      return NextResponse.json(response);
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