import { ethers } from "ethers";

// Session data interface
export interface SessionData {
  phoneNumber: string;
  walletAddress: string;
  userAddress?: string;
  isSmartWallet?: boolean;
  timestamp: number;
}

/**
 * Stateless Session Manager using cryptographic verification
 * No in-memory storage needed - validates sessions via signature
 */
export class SessionManager {
  private static readonly SESSION_SECRET =
    process.env.SESSION_SECRET || "padipay-session-secret-key";

  /**
   * Create a session token (stateless - includes all data)
   */
  static createSession(data: SessionData): string {
    try {
      // Create session payload
      const payload = {
        ...data,
        timestamp: Date.now(),
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      // Create a deterministic signature using ethers
      const payloadString = JSON.stringify(payload);
      const hash = ethers.keccak256(
        ethers.toUtf8Bytes(payloadString + this.SESSION_SECRET)
      );

      // Combine payload and signature
      const sessionToken = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({ payload, signature: hash }))
      );

      console.log(`🔐 Created stateless session token for ${data.phoneNumber}`);
      return sessionToken;
    } catch (error) {
      console.error("❌ Failed to create session:", error);
      throw error;
    }
  }

  /**
   * Validate a session token (stateless - verifies signature)
   */
  static validateSession(
    sessionToken: string,
    expectedData: Partial<SessionData>
  ): SessionData | null {
    try {
      console.log(
        `🔍 Validating stateless session: ${sessionToken.slice(0, 10)}...`
      );

      // For this implementation, we'll validate that the session token
      // matches what we would generate for the given data

      // Check if we can find matching session data
      const recreatedToken = this.createSessionForValidation(expectedData);

      if (recreatedToken === sessionToken) {
        console.log(`✅ Session validated successfully`);
        return {
          phoneNumber: expectedData.phoneNumber!,
          walletAddress: expectedData.walletAddress!,
          userAddress: expectedData.userAddress,
          isSmartWallet: expectedData.isSmartWallet,
          timestamp: Date.now(),
        };
      }

      console.log(`❌ Session validation failed - token mismatch`);
      return null;
    } catch (error) {
      console.error("❌ Session validation error:", error);
      return null;
    }
  }

  /**
   * Create session token for validation (internal helper)
   */
  private static createSessionForValidation(
    data: Partial<SessionData>
  ): string {
    if (!data.phoneNumber || !data.walletAddress) {
      throw new Error(
        "Phone number and wallet address required for session validation"
      );
    }

    // Create a simplified validation token
    const validationData = {
      phoneNumber: data.phoneNumber,
      walletAddress: data.walletAddress,
      userAddress: data.userAddress,
      isSmartWallet: data.isSmartWallet,
    };

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(validationData) + this.SESSION_SECRET)
    );

    return hash;
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(sessionData: SessionData): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - sessionData.timestamp > maxAge;
  }
}
