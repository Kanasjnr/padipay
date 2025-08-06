// Shared session store for API authentication
export interface SessionData {
  phoneNumber: string;
  walletAddress: string;
  timestamp: number;
}

export const sessionStore = new Map<string, SessionData>(); 