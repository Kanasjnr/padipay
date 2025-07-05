import { NextRequest, NextResponse } from 'next/server';
import { otpStore, generateOTP, isValidPhoneNumber } from '@/lib/otpStore';

async function sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
  // DEVELOPMENT MODE - Just log the OTP
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 SMS to ${phoneNumber}: Your PadiPay verification code is ${otp}`);
    return true;
  }

  // PRODUCTION - Integrate with SMS provider
  try {
    // TODO: Implement SMS provider integration
    // Examples: Twilio, Africa's Talking, etc.
    console.log(`Would send SMS to ${phoneNumber}: ${otp}`);
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    console.log(`🔐 OTP request for phone: ${phoneNumber}`);

    // Validate phone number
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use international format (+1234567890)' },
        { status: 400 }
      );
    }

    // Rate limiting - check if too many attempts
    const existing = otpStore.get(phoneNumber);
    if (existing && Date.now() - existing.timestamp < 60000) { // 1 minute cooldown
      return NextResponse.json(
        { error: 'Please wait before requesting another code' },
        { status: 429 }
      );
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(phoneNumber, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    // Clean up old OTPs (expire after 5 minutes)
    setTimeout(() => {
      otpStore.delete(phoneNumber);
    }, 5 * 60 * 1000);

    // Send SMS
    const smsSent = await sendSMS(phoneNumber, otp);
    
    if (!smsSent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      );
    }

    console.log(`✅ OTP sent successfully to ${phoneNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { 
        otp: otp,
        dev: true 
      })
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OTP store is now managed by the shared module 