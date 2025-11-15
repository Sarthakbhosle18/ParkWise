import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, userType } = await request.json();

    if (!email || !userType) {
      return NextResponse.json(
        { error: "Email and user type are required" },
        { status: 400 }
      );
    }

    // Find user by email and userType
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link will be sent.",
      });
    }

    if (user.userType !== userType) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link will be sent.",
      });
    }

    // Generate reset token (in production, this should be stored in DB with expiry)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // In a real application, you would:
    // 1. Store the reset token in the database with expiry time
    // 2. Send an email with the reset link
    // For now, we'll return the token (for development only)
    
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/${userType}/reset-password?token=${resetToken}`);

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link will be sent.",
      // Remove this in production - only for development
      devToken: resetToken,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process forgot password request" },
      { status: 500 }
    );
  }
}
