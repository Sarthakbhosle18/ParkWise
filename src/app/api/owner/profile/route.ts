import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ownerProfiles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate userId parameter
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Validate userId is a valid integer
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { 
          error: 'Valid User ID is required',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    // Query owner profile with user details
    const result = await db
      .select({
        id: ownerProfiles.id,
        userId: ownerProfiles.userId,
        phone: ownerProfiles.phone,
        createdAt: ownerProfiles.createdAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          userType: users.userType,
        },
      })
      .from(ownerProfiles)
      .innerJoin(users, eq(ownerProfiles.userId, users.id))
      .where(eq(ownerProfiles.userId, userIdInt))
      .limit(1);

    // Check if owner profile exists
    if (result.length === 0) {
      return NextResponse.json(
        { 
          error: 'Owner profile not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const ownerProfile = result[0];

    // Validate user is of type 'owner'
    if (ownerProfile.user.userType !== 'owner') {
      return NextResponse.json(
        { 
          error: 'User is not an owner',
          code: 'INVALID_USER_TYPE'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(ownerProfile, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}