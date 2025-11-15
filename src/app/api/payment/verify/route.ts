import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = body;

    // Validate required Razorpay fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          code: 'MISSING_FIELDS' 
        },
        { status: 400 }
      );
    }

    // Verify signature using Razorpay secret
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    
    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'Payment verification failed - Invalid signature',
          code: 'VERIFICATION_FAILED'
        },
        { status: 400 }
      );
    }

    // If bookingId is provided, update the booking
    if (bookingId) {
      const bookingIdInt = parseInt(bookingId.toString());
      
      if (isNaN(bookingIdInt)) {
        return NextResponse.json(
          {
            error: 'Invalid booking ID',
            code: 'INVALID_BOOKING_ID'
          },
          { status: 400 }
        );
      }

      // Check if booking exists
      const existingBooking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingIdInt))
        .limit(1);

      if (existingBooking.length === 0) {
        return NextResponse.json(
          {
            error: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Update booking with payment details
      const updatedBooking = await db
        .update(bookings)
        .set({
          paymentStatus: 'completed',
          paymentId: razorpay_payment_id
        })
        .where(eq(bookings.id, bookingIdInt))
        .returning();

      return NextResponse.json(
        {
          success: true,
          verified: true,
          message: 'Payment verified successfully',
          booking: updatedBooking[0]
        },
        { status: 200 }
      );
    }

    // If no bookingId provided, just return verification success
    return NextResponse.json(
      {
        success: true,
        verified: true,
        message: 'Payment verified successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('POST /api/verify-payment error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error.message,
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}