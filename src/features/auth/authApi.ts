import { ApiError, apiFetch } from "../../lib/api/client";
import { API_BASE_URL } from "../../lib/api/config";
import { clearSession, getRefreshToken, saveSession } from "./sessionStore";
import { AuthSession, CurrentUserResponse, LoginCredentials } from "./types";

export async function loginWithPassword(
  credentials: LoginCredentials
): Promise<AuthSession> {
  const session = await postPublic<AuthSession>("/auth/login", credentials);
  saveSession(session);
  return session;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiFetch<CurrentUserResponse>("/users/me");
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await apiFetch<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    }).catch(() => undefined);
  }

  clearSession();
}

async function postPublic<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload.error?.code ?? "api.request_failed",
      payload.error?.message ?? "Request failed",
      payload.error?.details
    );
  }

  return payload.data as T;
}
