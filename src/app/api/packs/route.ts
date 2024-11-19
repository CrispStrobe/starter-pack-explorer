import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json(
        { error: 'Pack IDs are required' },
        { status: 400 }
      );
    }

    const packIds = ids.split(',');
    const client = await clientPromise;
    const db = client.db("starterpacks");

    const packs = await db.collection("starter_packs")
      .find({ rkey: { $in: packIds } })
      .project({
        rkey: 1,
        name: 1,
        creator: 1,
      })
      .toArray();

    // Create a map of pack ID to pack details
    const packMap = packs.reduce((acc, pack) => {
      acc[pack.rkey] = {
        name: pack.name,
        creator: pack.creator
      };
      return acc;
    }, {} as Record<string, { name: string; creator: string }>);

    return NextResponse.json(packMap);

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pack details' },
      { status: 500 }
    );
  }
}