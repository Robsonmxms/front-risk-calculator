import { apiFetch, apiFetchEnvelope } from "../../lib/api/client";
import type {
  CreateManagedUserInput,
  SafeUser,
  UpdateManagedUserInput,
  UserListMeta,
  UserRole,
  UserStatus
} from "../../lib/contracts/auth";

export interface ListManagedUsersInput {
  role: UserRole;
  search?: string;
  status?: UserStatus;
  page: number;
  perPage: number;
  signal?: AbortSignal;
}

export async function listManagedUsers(input: ListManagedUsersInput) {
  const query = new URLSearchParams({
    role: input.role,
    page: String(input.page),
    per_page: String(input.perPage)
  });
  if (input.search) query.set("search", input.search);
  if (input.status) query.set("status", input.status);

  return apiFetchEnvelope<SafeUser[], UserListMeta>(`/users?${query.toString()}`, {
    signal: input.signal
  });
}

export function createManagedUser(input: CreateManagedUserInput): Promise<SafeUser> {
  return apiFetch<SafeUser>("/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateManagedUser(
  userId: string,
  input: UpdateManagedUserInput
): Promise<SafeUser> {
  return apiFetch<SafeUser>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}
