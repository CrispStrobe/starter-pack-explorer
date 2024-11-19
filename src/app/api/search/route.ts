// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'packs';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("starterpacks");

    const searchRegex = new RegExp(query, 'i');

    if (type === 'packs') {
      // Search packs by name or creator
      const matchingPacks = await db.collection('starter_packs')
        .find({
          $or: [
            { name: { $regex: searchRegex } },
            { creator: { $regex: searchRegex } }
          ]
        })
        .toArray();

      console.log(`Found ${matchingPacks.length} matching packs for query "${query}".`);

      if (matchingPacks.length === 0) {
        return NextResponse.json([]);
      }

      // For each pack, fetch its member user details
      const packsWithUsers = await Promise.all(matchingPacks.map(async (pack) => {
        // Ensure 'pack.users' is an array
        const packUsersArray: string[] = Array.isArray(pack.users) ? pack.users : [];

        if (!Array.isArray(packUsersArray)) {
          console.warn(`Pack with rkey ${pack.rkey} has invalid 'users' field.`);
        }

        if (packUsersArray.length === 0) {
          console.warn(`Pack with rkey ${pack.rkey} has no users.`);
        }

        // Fetch user details based on the 'users' array in the pack
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

      return NextResponse.json(packsWithUsers);

    } else {
      // Search users
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
        .toArray();

      console.log(`Found ${users.length} matching users for query "${query}".`);

      // Enhance users with pack details
      const enhancedUsers = await Promise.all(users.map(async (user) => {
        if (!Array.isArray(user.pack_ids) || user.pack_ids.length === 0) {
          return {
            ...user,
            packs: []
          };
        }

        // Fetch pack details for each pack ID
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
            console.warn(`Pack with rkey ${packId} not found for user ${user.did}.`);
            return {
              rkey: packId,
              name: `Pack ${packId}`,
              creator: "Unknown",
              description: "",
              user_count: 0,
              users: []
            };
          }

          // Ensure 'pack.users' is an array
          const packUsersArray: string[] = Array.isArray(pack.users) ? pack.users : [];

          if (!Array.isArray(packUsersArray)) {
            console.warn(`Pack with rkey ${pack.rkey} has invalid 'users' field.`);
          }

          if (packUsersArray.length === 0) {
            console.warn(`Pack with rkey ${pack.rkey} has no users.`);
          }

          // Fetch users in this pack
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

      return NextResponse.json(enhancedUsers);
    }

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
