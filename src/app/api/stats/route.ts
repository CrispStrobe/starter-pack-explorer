// src/app/api/stats/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ensure fresh stats

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("starterpacks");

    // Get active packs (not deleted and completed)
    const totalPacks = await db.collection("starter_packs")
      .countDocuments({ 
        deleted: { $ne: true },
        status: 'completed'
      });

    // Get active users (not deleted and with valid handle)
    const totalUsers = await db.collection("users")
      .countDocuments({ 
        deleted: { $ne: true },
        handle: { $exists: true, $ne: '' }
      });

    // Calculate pack statistics
    const packStats = await db.collection("starter_packs")
      .aggregate([
        {
          $match: { 
            deleted: { $ne: true },
            status: 'completed'
          }
        },
        {
          $project: {
            name: 1,
            userCount: { 
              $cond: {
                if: { $isArray: "$users" },
                then: { $size: "$users" },
                else: 0
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            avgSize: { $avg: "$userCount" },
            totalUserSlots: { $sum: "$userCount" },
            activePacks: { $sum: 1 },
            minSize: { $min: "$userCount" },
            maxSize: { $max: "$userCount" }
          }
        }
      ]).toArray();

    const stats = packStats[0] || {
      avgSize: 0,
      totalUserSlots: 0,
      activePacks: 0,
      minSize: 0,
      maxSize: 0
    };

    // Log stats for debugging
    console.log('Raw stats:', {
      totalPacks,
      totalUsers,
      packStats: stats
    });

    return NextResponse.json({
      total_packs: totalPacks,
      total_users: totalUsers,
      avg_pack_size: Math.round(stats.avgSize),
      min_pack_size: stats.minSize,
      max_pack_size: stats.maxSize,
      total_user_slots: stats.totalUserSlots,
      active_packs: stats.activePacks,
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