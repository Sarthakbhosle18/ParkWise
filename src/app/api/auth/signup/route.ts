import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, ownerProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userType, name, phone } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!userType) {
      return NextResponse.json(
        { error: 'User type is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate userType
    if (userType !== 'owner' && userType !== 'driver') {
      return NextResponse.json(
        { error: 'User type must be either "owner" or "driver"', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();
    const sanitizedPhone = phone ? phone.trim() : null;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: sanitizedEmail,
        passwordHash,
        userType,
        name: sanitizedName,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // If userType is owner, create owner profile
    if (userType === 'owner') {
      await db
        .insert(ownerProfiles)
        .values({
          userId: newUser[0].id,
          phone: sanitizedPhone,
          createdAt: new Date().toISOString(),
        })
        .returning();
    }

    // Return success response without password hash
    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          userType: newUser[0].userType,
          name: newUser[0].name,
        },
        message: 'User registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}