export type UserRole = "admin" | "analyst" | "user";
export type UserStatus = "active" | "disabled";
export type AccountMemberRole = "owner" | "analyst" | "viewer";
export type OfficeMembershipRole = "office_admin" | "advisor" | "analyst" | "assistant" | "client";

export interface OfficeMembershipSummary {
  officeId: string;
  officeName: string;
  role: OfficeMembershipRole;
}

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
  officeMemberships: OfficeMembershipSummary[];
  accountMemberships: AccountMembershipSummary[];
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserPagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UserListMeta {
  pagination: UserPagination;
}

export interface CreateManagedUserInput {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  initialPassword: string;
}

export interface UpdateManagedUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
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
