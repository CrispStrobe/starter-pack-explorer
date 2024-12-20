import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const packId = params.id;

  try {
    const client = await clientPromise;
    const db = client.db("starterpacks");

    // Ensure we project the fields we need, including `users`
    const pack = await db.collection("starter_packs").findOne(
      {
        rkey: packId,
        deleted: { $ne: true }
      },
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

    if (!pack) {
      console.log('Pack not found:', packId);
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    // Get creator details (minimal)
    const creator = pack.creator_did
      ? await db.collection("users").findOne(
          { did: pack.creator_did, deleted: { $ne: true } },
          {
            projection: {
              did: 1,
              handle: 1,
              display_name: 1,
              followers_count: 1
            }
          }
        )
      : null;

    console.log('Pack fetched:', pack);
    console.log('Pack users:', pack.users);

    // Get members details based on `pack.users`
    const members = pack.users && pack.users.length > 0
      ? await db.collection("users")
          .find({
            did: { $in: pack.users },
            deleted: { $ne: true }
          })
          .project({
            did: 1,
            handle: 1,
            display_name: 1,
            followers_count: 1
          })
          .toArray()
      : [];

    console.log('Members fetched:', members);

    const response = {
      ...pack,
      creator_details: creator,
      members
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pack details' },
      { status: 500 }
    );
  }
}
