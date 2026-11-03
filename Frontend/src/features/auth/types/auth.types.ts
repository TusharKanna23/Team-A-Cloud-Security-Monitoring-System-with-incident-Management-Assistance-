export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  mfaRequired?: boolean;
}

export interface SessionInfo {
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  isCurrent: boolean;
}