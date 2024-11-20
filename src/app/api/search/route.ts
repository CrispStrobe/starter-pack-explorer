import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'packs';
    const page = parseInt(searchParams.get('page') || '1');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("starterpacks");
    const searchRegex = new RegExp(query, 'i');
    const skip = (page - 1) * ITEMS_PER_PAGE;

    if (type === 'packs') {
      // Get total count for pagination
      const totalPacks = await db.collection('starter_packs')
        .countDocuments({
          $or: [
            { name: { $regex: searchRegex } },
            { creator: { $regex: searchRegex } }
          ]
        });

      // Search packs with pagination
      const matchingPacks = await db.collection('starter_packs')
        .find({
          $or: [
            { name: { $regex: searchRegex } },
            { creator: { $regex: searchRegex } }
          ]
        })
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .toArray();

      const packsWithUsers = await Promise.all(matchingPacks.map(async (pack) => {
        const packUsersArray: string[] = Array.isArray(pack.users) ? pack.users : [];

        const packUsers = await db.collection('users')
          .find({ did: { $in: packUsersArray } })
          .project({
            did: 1,
            handle: 1,
            display_name: 1
          })
          .toArray();

        return {
          rkey: pack.rkey,
          name: pack.name,
          creator: pack.creator,
          description: pack.description,
          user_count: pack.user_count || packUsers.length,
          users: packUsers,
        };
      }));

      return NextResponse.json({
        items: packsWithUsers,
        total: totalPacks,
        page,
        totalPages: Math.ceil(totalPacks / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
      });

    } else {
      // Get total count for pagination
      const totalUsers = await db.collection('users')
        .countDocuments({
          $or: [
            { handle: { $regex: searchRegex } },
            { display_name: { $regex: searchRegex } }
          ]
        });

      // Search users with pagination
      const users = await db.collection('users')
        .find({
          $or: [
            { handle: { $regex: searchRegex } },
            { display_name: { $regex: searchRegex } }
          ]
        })
        .project({
          did: 1,
          handle: 1,
          display_name: 1,
          pack_ids: 1
        })
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .toArray();

      const enhancedUsers = await Promise.all(users.map(async (user) => {
        if (!Array.isArray(user.pack_ids) || user.pack_ids.length === 0) {
          return {
            ...user,
            packs: []
          };
        }

        const userPacks = await Promise.all(user.pack_ids.map(async (packId) => {
          const pack = await db.collection('starter_packs').findOne({ rkey: packId }, {
            projection: {
              rkey: 1,
              name: 1,
              creator: 1,
              description: 1,
              user_count: 1,
              users: 1
            }
          });

          if (!pack) {
            return {
              rkey: packId,
              name: `Pack ${packId}`,
              creator: "Unknown",
              description: "",
              user_count: 0,
              users: []
            };
          }

          const packUsersArray: string[] = Array.isArray(pack.users) ? pack.users : [];

          const packUsers = await db.collection('users')
            .find({ did: { $in: packUsersArray } })
            .project({
              did: 1,
              handle: 1,
              display_name: 1
            })
            .toArray();

          return {
            rkey: pack.rkey,
            name: pack.name,
            creator: pack.creator,
            description: pack.description,
            user_count: pack.user_count || packUsers.length,
            users: packUsers,
          };
        }));

        return {
          ...user,
          packs: userPacks
        };
      }));

      return NextResponse.json({
        items: enhancedUsers,
        total: totalUsers,
        page,
        totalPages: Math.ceil(totalUsers / ITEMS_PER_PAGE),
        itemsPerPage: ITEMS_PER_PAGE
      });
    }

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}