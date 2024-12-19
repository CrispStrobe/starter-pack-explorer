// src/app/api/pack/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const packId = await params.id; // Await the params

  try {
    const client = await clientPromise;
    const db = client.db("starterpacks");

    // Find the pack
    const pack = await db.collection("starter_packs").findOne({
      rkey: packId
    });

    if (!pack) {
      console.log('Pack not found:', packId);
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    // Get creator details
    const creator = await db.collection("users").findOne(
      { did: pack.creator_did },
      {
        projection: {
          did: 1,
          handle: 1,
          display_name: 1,
          followers_count: 1
        }
      }
    );

    // Get member details
    const members = await db.collection("users")
      .find({ 
        did: { $in: pack.users || [] }
      })
      .project({
        did: 1,
        handle: 1,
        display_name: 1,
        followers_count: 1
      })
      .toArray();

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