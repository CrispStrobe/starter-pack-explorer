import { NextRequest } from 'next/server';
import { WithId, Document } from 'mongodb';
import clientPromise from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PackDocument extends WithId<Document> {
  rkey: string;
  name: string;
  creator: string;
  creator_did: string;
  description?: string;
  user_count: number;
  users: string[];
  weekly_joins: number;
  total_joins: number;
  created_at: string;
  deleted?: boolean;
  status?: string;
  last_known_state?: {
    name?: string;
    creator?: string;
  };
}

const ITEMS_PER_PAGE = 10;
const QUERY_TIMEOUT = 12000;

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
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

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
          $match: {
            deleted: { $ne: true }
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

      const [totalPacks, matchingPacks] = await Promise.all([
        runWithTimeout(
          db.collection('starter_packs').countDocuments({
            $or: [
              { name: { $regex: searchRegex } },
              { creator: { $regex: searchRegex } }
            ],
            deleted: { $ne: true }
          }),
          QUERY_TIMEOUT
        ),
        runWithTimeout(
          db.collection('starter_packs')
            .aggregate<PackDocument>(pipeline)
            .toArray(),
          QUERY_TIMEOUT
        )
      ]);

      const creatorDids = matchingPacks
        .map(p => p.creator_did)
        .filter((did): did is string => Boolean(did));

      const creators = creatorDids.length ? await runWithTimeout(
        db.collection('users')
          .find(
            { did: { $in: creatorDids }, deleted: { $ne: true } },
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
      
      const packsWithDetails = matchingPacks.map(pack => ({
        ...pack,
        name: pack.deleted ? pack.last_known_state?.name || pack.name : pack.name,
        creator: pack.deleted ? pack.last_known_state?.creator || pack.creator : pack.creator,
        creator_details: creatorsMap.get(pack.creator_did) || null
      }));

      return Response.json({
        items: packsWithDetails,
        total: totalPacks,
        page,
        totalPages: Math.ceil(totalPacks / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
      });

    } else {
      const pipeline = [
        {
          $match: {
            $or: [
              { handle: { $regex: searchRegex } },
              { display_name: { $regex: searchRegex } }
            ]
          }
        },
        // Only filter "really deleted" users
        {
          $match: {
            $or: [
              { deleted: { $ne: true } },
              { deletion_reason: "no_remaining_packs" }  // These might be active
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
            deleted: 1,
            deletion_reason: 1  // Include this to help with debugging
          }
        }
      ];

      const [totalUsers, users] = await Promise.all([
        runWithTimeout(
          db.collection('users').countDocuments({
            $or: [
              { handle: { $regex: searchRegex } },
              { display_name: { $regex: searchRegex } }
            ],
            deleted: { $ne: true }
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

      const packIds = users.reduce<string[]>((acc, user) => {
        const userPacks = [
          ...(user.pack_ids || []),
          ...(user.created_packs || [])
        ].filter((id): id is string => Boolean(id));
        return [...acc, ...userPacks];
      }, []);

      const uniquePackIds = Array.from(new Set(packIds));

      const packs = uniquePackIds.length ? await runWithTimeout(
        db.collection('starter_packs')
          .find(
            { rkey: { $in: uniquePackIds }, deleted: { $ne: true } },
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

      const packsMap = new Map(
        packs.map(p => [p.rkey, p])
      );

      const enhancedUsers = users.map(user => ({
        did: user.did,
        handle: user.handle,
        display_name: user.display_name,
        followers_count: user.followers_count,
        follows_count: user.follows_count,
        member_packs: (user.pack_ids || [])
          .map((id: string) => packsMap.get(id))
          .filter((pack: PackDocument | undefined): pack is PackDocument => Boolean(pack))
          .map((pack: PackDocument) => ({
            rkey: pack.rkey,
            name: pack.deleted ? pack.last_known_state?.name || pack.name : pack.name,
            creator: pack.deleted ? pack.last_known_state?.creator || pack.creator : pack.creator,
            creator_did: pack.creator_did,
            user_count: pack.user_count,
            deleted: pack.deleted,
            status: pack.status
          })),
        created_packs: (user.created_packs || [])
          .map((id: string) => packsMap.get(id))
          .filter((pack: PackDocument | undefined): pack is PackDocument => Boolean(pack))
          .map((pack: PackDocument) => ({
            rkey: pack.rkey,
            name: pack.deleted ? pack.last_known_state?.name || pack.name : pack.name,
            creator: pack.deleted ? pack.last_known_state?.creator || pack.creator : pack.creator,
            creator_did: pack.creator_did,
            user_count: pack.user_count,
            deleted: pack.deleted,
            status: pack.status
          }))
      }));

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
    return Response.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
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