// src/app/api/user/[id]/route.ts
import { NextRequest } from 'next/server';
import clientPromise from '@/lib/db';
import { Db } from 'mongodb';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

// Define the shape of the starter pack documents
interface StarterPack {
  rkey: string;
  name?: string;
  creator?: string;
  creator_did?: string;
  description?: string;
  user_count?: number;
  users?: string[];
  weekly_joins?: number;
  total_joins?: number;
  created_at?: Date;
  deleted?: boolean;
  status?: string;
}

// Define the shape of the user document
interface User {
  did: string;
  handle?: string;
  display_name?: string;
  followers_count?: number;
  follows_count?: number;
  pack_ids?: string[];
  created_packs?: string[];
  deleted?: boolean;
}

// Get complete pack details
const getFullPackDetails = async (
  db: Db,
  pack: StarterPack
): Promise<StarterPack | null> => {
  const fullPack = await db.collection<StarterPack>('starter_packs').findOne(
    { rkey: pack.rkey },
    {
      projection: {
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
        status: 1
      }
    }
  );
  return fullPack;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = context.params.id;
    const client = await clientPromise;
    const db = client.db("starterpacks");

    // Get user details
    const user = await db.collection<User>("users").findOne(
      { did: userId, deleted: { $ne: true } },
      {
        projection: {
          did: 1,
          handle: 1,
          display_name: 1,
          followers_count: 1,
          follows_count: 1,
          pack_ids: 1,
          created_packs: 1
        }
      }
    );

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get member packs with full details
    let memberPacks: StarterPack[] = [];
    if (user.pack_ids && user.pack_ids.length) {
      const packs = await db.collection<StarterPack>('starter_packs')
        .find({
          rkey: { $in: user.pack_ids },
          deleted: { $ne: true }
        })
        .toArray();
      memberPacks = await Promise.all(packs.map(pack => getFullPackDetails(db, pack)))
        .then(results => results.filter((p): p is StarterPack => p !== null));
    }

    // Get created packs with full details
    const createdPacksArray = await db.collection<StarterPack>('starter_packs')
      .find({
        creator_did: userId,
        deleted: { $ne: true }
      })
      .toArray();
    const createdPacks = await Promise.all(createdPacksArray.map(pack => getFullPackDetails(db, pack)))
      .then(results => results.filter((p): p is StarterPack => p !== null));

    // Transform to match EnhancedUser interface if needed
    const response = {
      did: user.did,
      handle: user.handle,
      display_name: user.display_name,
      followers_count: user.followers_count,
      follows_count: user.follows_count,
      member_packs: memberPacks,
      created_packs: createdPacks
    };

    return Response.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
