import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession
} from "../../features/auth/sessionStore";
import { AuthSession } from "../../features/auth/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, "auth.session_expired", "Session expired");
  }
}

interface ApiFetchOptions extends RequestInit {
  retryOnUnauthorized?: boolean;
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

interface SuccessEnvelope<T> {
  data: T;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const response = await rawFetch(path, options);

  if (response.status === 401 && retryOnUnauthorized && getRefreshToken()) {
    try {
      await refreshSession();
      return apiFetch<T>(path, { ...options, retryOnUnauthorized: false });
    } catch {
      clearSession();
      throw new SessionExpiredError();
    }
  }

  return parseResponse<T>(response);
}

export async function refreshSession(): Promise<AuthSession> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new SessionExpiredError();
  }

  const response = await rawFetch("/auth/refresh", {
    method: "POST",
    retryOnUnauthorized: false,
    body: JSON.stringify({ refreshToken })
  });
  const session = await parseResponse<AuthSession>(response);
  saveSession(session);
  return session;
}

async function rawFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { retryOnUnauthorized: _retryOnUnauthorized, headers, ...fetchOptions } = options;
  const accessToken = getAccessToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers
    }
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as SuccessEnvelope<T> & ErrorEnvelope;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error?.code ?? "api.request_failed",
      body.error?.message ?? "Request failed",
      body.error?.details
    );
  }

  return body.data;
}
