import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: "Email and password are required",
          code: "MISSING_FIELDS" 
        },
        { status: 400 }
      );
    }

    // Sanitize email input
    const sanitizedEmail = email.trim().toLowerCase();

    // Find user by email
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    // Check if user exists
    if (userRecords.length === 0) {
      return NextResponse.json(
        { 
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS" 
        },
        { status: 401 }
      );
    }

    const user = userRecords[0];

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS" 
        },
        { status: 401 }
      );
    }

    // Return success response without password hash
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
          name: user.name
        },
        message: "Login successful"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: "SERVER_ERROR"
      },
      { status: 500 }
    );
  }
}