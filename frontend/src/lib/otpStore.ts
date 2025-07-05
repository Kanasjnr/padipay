// Shared OTP store that persists across hot reloads
interface OTPData {
  otp: string;
  timestamp: number;
  attempts: number;
}

// Use globalThis to persist across hot reloads in development
const globalForOTP = globalThis as unknown as {
  otpStore: Map<string, OTPData> | undefined;
};

export const otpStore = globalForOTP.otpStore ?? new Map<string, OTPData>();

if (process.env.NODE_ENV !== 'production') {
  globalForOTP.otpStore = otpStore;
}

// Utility functions
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidPhoneNumber(phone: string): boolean {
  // Enhanced validation for international phone numbers
  const phoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(phone);
}

export function cleanupExpiredOTPs() {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  for (const [phoneNumber, data] of otpStore.entries()) {
    if (now - data.timestamp > fiveMinutes) {
      otpStore.delete(phoneNumber);
    }
  }
}

// Clean up expired OTPs every minute
if (typeof window === 'undefined') { // Only run on server
  setInterval(cleanupExpiredOTPs, 60 * 1000);
} 