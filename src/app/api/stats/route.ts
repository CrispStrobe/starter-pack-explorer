import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("starterpacks");

    // Get total number of packs
    const totalPacks = await db.collection("starter_packs").countDocuments();
    
    // Get total number of users
    const totalUsers = await db.collection("users").countDocuments();
    
    // Get active packs (packs with users)
    const activePacks = await db.collection("starter_packs")
      .countDocuments({ "users": { $exists: true, $not: { $size: 0 } } });
    
    // Calculate average pack size
    const packSizes = await db.collection("starter_packs")
      .aggregate([
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
      active_packs: activePacks,
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