import { NextRequest } from 'next/server';
import clientPromise from '@/lib/db';

interface RouteContext {
  params: {
    id: string;
  };
}

interface StarterPack {
  rkey: string;
  name?: string;
  creator?: string;
  creator_did?: string;
  user_count?: number;
}

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

    // Get member packs with minimal details
    const memberPacks = user.pack_ids?.length
      ? await db.collection<StarterPack>('starter_packs')
          .find({
            rkey: { $in: user.pack_ids },
            deleted: { $ne: true }
          })
          .project({
            rkey: 1,
            name: 1,
            creator: 1,
            creator_did: 1,
            user_count: 1
          })
          .toArray()
      : [];

    // Get created packs with minimal details
    const createdPacks = await db.collection<StarterPack>('starter_packs')
      .find({
        creator_did: userId,
        deleted: { $ne: true }
      })
      .project({
        rkey: 1,
        name: 1,
        creator: 1,
        creator_did: 1,
        user_count: 1
      })
      .toArray();

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
