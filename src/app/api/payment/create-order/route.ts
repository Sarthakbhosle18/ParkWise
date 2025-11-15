import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt, notes } = body;

    // Validation: amount is required and must be greater than 0
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          error: 'Amount is required and must be greater than 0',
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const amountInPaise = Math.round(amount * 100);
    
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment order: ' + error.message,
        code: 'ORDER_CREATION_FAILED',
      },
      { status: 500 }
    );
  }
}