export type UserRole = "admin" | "analyst" | "user";
export type UserStatus = "active" | "disabled";
export type AccountMemberRole = "owner" | "analyst" | "viewer";

export interface AccountMembershipSummary {
  accountId: string;
  accountName: string;
  role: AccountMemberRole;
}

export interface Actor {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accountMemberships: AccountMembershipSummary[];
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  actor: Actor;
}

export interface CurrentUserResponse {
  actor: Actor;
  user: SafeUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
