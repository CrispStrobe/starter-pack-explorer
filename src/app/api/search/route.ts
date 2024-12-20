// src/app/api/search/route.ts
import { NextRequest } from 'next/server';
import { WithId, Document } from 'mongodb';
import clientPromise from '@/lib/db';

// dynamic rendering (avoid only statical render)
export const dynamic = 'force-dynamic';

interface PackDocument extends WithId<Document> {
  rkey: string;
  name: string;
  creator: string;
  creator_did: string;
  user_count: number;
  deleted?: boolean;
  status?: string;
  last_known_state?: {
    name?: string;
    creator?: string;
  };
}

interface PackMapItem {
  rkey: string;
  name: string;
  creator: string;
  creator_did: string;
  user_count: number;
  deleted?: boolean;
  status?: string;
  last_known_state?: {
    name?: string;
    creator?: string;
  };
}

const ITEMS_PER_PAGE = 10;
const QUERY_TIMEOUT = 8000; // 8 seconds timeout

// Helper function to run query with timeout
async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'packs';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrderParam = searchParams.get('sortOrder') || 'asc';
    const sortOrder = sortOrderParam === 'desc' ? -1 : 1;

    if (!query || query.length < 2) {
      return Response.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('starterpacks');
    const searchRegex = new RegExp(query, 'i');
    const skip = (page - 1) * ITEMS_PER_PAGE;

    if (type === 'packs') {
      // Use $or with explicit index hints if needed
      const pipeline = [
        {
          $match: {
            $or: [
              { name: { $regex: searchRegex } },
              { creator: { $regex: searchRegex } }
            ]
          }
        },
        {
          $sort: { [getPackSortField(sortBy)]: sortOrder }
        },
        {
          $skip: skip
        },
        {
          $limit: ITEMS_PER_PAGE
        },
        {
          $project: {
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
          }
        }
      ];

      // Run count and search in parallel with timeout
      const [totalPacks, matchingPacks] = await Promise.all([
        runWithTimeout(
          db.collection('starter_packs').countDocuments({
            $or: [
              { name: { $regex: searchRegex } },
              { creator: { $regex: searchRegex } }
            ]
          }),
          QUERY_TIMEOUT
        ),
        runWithTimeout(
          db.collection('starter_packs')
            .aggregate(pipeline)
            .toArray(),
          QUERY_TIMEOUT
        )
      ]);

      // Efficiently get creator details using existing indexes
      const creatorDids = Array.from(new Set(matchingPacks.map(p => p.creator_did)));

      const creators = creatorDids.length > 0 ? await runWithTimeout(
        db.collection('users')
          .find(
            { did: { $in: creatorDids } },
            {
              projection: {
                did: 1,
                handle: 1,
                display_name: 1,
                followers_count: 1
              }
            }
          )
          .toArray(),
        QUERY_TIMEOUT
      ) : [];

      const creatorsMap = new Map(creators.map(c => [c.did, c]));

      const packsWithDetails = matchingPacks.map(pack => {
        const packData = pack.deleted ? {
          ...pack,
          name: pack.last_known_state?.name || pack.name,
          creator: pack.last_known_state?.creator || pack.creator
        } : pack;

        return {
          ...packData,
          creator_details: creatorsMap.get(pack.creator_did) || null
        };
      });

      return Response.json({
        items: packsWithDetails,
        total: totalPacks,
        page,
        totalPages: Math.ceil(totalPacks / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
      });

    } else {
      // User search with existing indexes
      const pipeline = [
        {
          $match: {
            $or: [
              { handle: { $regex: searchRegex } },
              { display_name: { $regex: searchRegex } }
            ]
          }
        },
        {
          $sort: { [getUserSortField(sortBy)]: sortOrder }
        },
        {
          $skip: skip
        },
        {
          $limit: ITEMS_PER_PAGE
        },
        {
          $project: {
            did: 1,
            handle: 1,
            display_name: 1,
            followers_count: 1,
            follows_count: 1,
            pack_ids: 1,
            created_packs: 1,
            deleted: 1
          }
        }
      ];

      const [totalUsers, users] = await Promise.all([
        runWithTimeout(
          db.collection('users').countDocuments({
            $or: [
              { handle: { $regex: searchRegex } },
              { display_name: { $regex: searchRegex } }
            ]
          }),
          QUERY_TIMEOUT
        ),
        runWithTimeout(
          db.collection('users')
            .aggregate(pipeline)
            .toArray(),
          QUERY_TIMEOUT
        )
      ]);

      // Efficiently get pack details using rkey index
      const allPackIds = Array.from(new Set(
        [].concat(
          ...(users.flatMap(u => u.pack_ids || [])),
          ...(users.flatMap(u => u.created_packs || []))
        )
      ));
      
      const packs = allPackIds.length ? await runWithTimeout(
        db.collection<PackDocument>('starter_packs')
          .find(
            { rkey: { $in: allPackIds } },
            {
              projection: {
                rkey: 1,
                name: 1,
                creator: 1,
                creator_did: 1,
                user_count: 1,
                deleted: 1,
                status: 1,
                last_known_state: 1
              }
            }
          )
          .toArray(),
        QUERY_TIMEOUT
      ) : [];
      
      const packsMap = new Map<string, PackMapItem>(
        packs.map((p: PackDocument): [string, PackMapItem] => [
          p.rkey,
          {
            rkey: p.rkey,
            name: p.name,
            creator: p.creator,
            creator_did: p.creator_did,
            user_count: p.user_count,
            deleted: p.deleted,
            status: p.status,
            last_known_state: p.last_known_state
          }
        ])
      );
      
      const transformPack = (pack: PackMapItem) => ({
        rkey: pack.rkey,
        name: pack.deleted ? pack.last_known_state?.name || pack.name : pack.name,
        creator: pack.deleted ? pack.last_known_state?.creator || pack.creator : pack.creator,
        creator_did: pack.creator_did,
        user_count: pack.user_count,
        deleted: pack.deleted,
        status: pack.status
      });
      
      const enhancedUsers = users.map(user => {
        const memberPacks = (user.pack_ids || [])
          .map((id: string) => packsMap.get(id))
          .filter((pack: PackMapItem | undefined): pack is PackMapItem => pack !== undefined)
          .map(transformPack);
      
        const createdPacks = (user.created_packs || [])
          .map((id: string) => packsMap.get(id))
          .filter((pack: PackMapItem | undefined): pack is PackMapItem => pack !== undefined)
          .map(transformPack);
      
        return {
          did: user.did,
          handle: user.handle,
          display_name: user.display_name,
          followers_count: user.followers_count,
          follows_count: user.follows_count,
          member_packs: memberPacks,
          created_packs: createdPacks,
          deleted: user.deleted
        };
      });

      return Response.json({
        items: enhancedUsers,
        total: totalUsers,
        page,
        totalPages: Math.ceil(totalUsers / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
      });
    }
  } catch (error) {
    console.error('Search Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { 
        error: 'Search failed', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

function getPackSortField(sortBy: string): string {
  switch (sortBy) {
    case 'name': return 'name';
    case 'members': return 'user_count';
    case 'activity': return 'weekly_joins';
    case 'created': return 'created_at';
    default: return 'name';
  }
}

function getUserSortField(sortBy: string): string {
  switch (sortBy) {
    case 'name': return 'display_name';
    case 'handle': return 'handle';
    case 'followers': return 'followers_count';
    default: return 'display_name';
  }
}