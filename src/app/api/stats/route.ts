// src/app/api/stats/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("starterpacks");

    // Get total number of packs (excluding deleted)
    const totalPacks = await db.collection("starter_packs")
      .countDocuments({ deleted: { $ne: true } });

    // Get total number of users (excluding deleted)
    const totalUsers = await db.collection("users")
      .countDocuments({ deleted: { $ne: true } });

    // Calculate average pack size
    const packSizes = await db.collection("starter_packs")
      .aggregate([
        {
          $match: { deleted: { $ne: true } }
        },
        {
          $project: {
            userCount: { $size: { $ifNull: ["$users", []] } }
          }
        },
        {
          $group: {
            _id: null,
            avgSize: { $avg: "$userCount" }
          }
        }
      ]).toArray();

    const avgPackSize = packSizes[0]?.avgSize || 0;

    return NextResponse.json({
      total_packs: totalPacks,
      total_users: totalUsers,
      avg_pack_size: Math.round(avgPackSize),
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}