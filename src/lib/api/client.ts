import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession
} from "../../features/auth/sessionStore";
import { AuthSession } from "../../features/auth/types";

export const API_BASE_URL =
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
  meta?: Record<string, unknown>;
}

export interface ApiEnvelope<T, M = Record<string, unknown> | undefined> {
  data: T;
  meta?: M;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const envelope = await apiFetchEnvelope<T>(path, options);
  return envelope.data;
}

export async function apiFetchEnvelope<T, M = Record<string, unknown> | undefined>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiEnvelope<T, M>> {
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const response = await rawFetch(path, options);

  if (response.status === 401 && retryOnUnauthorized && getRefreshToken()) {
    try {
      await refreshSession();
      return apiFetchEnvelope<T, M>(path, { ...options, retryOnUnauthorized: false });
    } catch {
      clearSession();
      throw new SessionExpiredError();
    }
  }

  return parseResponse<T, M>(response);
}

export async function apiFetchBlob(
  path: string,
  options: ApiFetchOptions = {}
): Promise<{ blob: Blob; filename?: string; contentType?: string }> {
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const response = await rawFetch(path, options);

  if (response.status === 401 && retryOnUnauthorized && getRefreshToken()) {
    try {
      await refreshSession();
      return apiFetchBlob(path, { ...options, retryOnUnauthorized: false });
    } catch {
      clearSession();
      throw new SessionExpiredError();
    }
  }

  if (!response.ok) {
    await parseResponse<never>(response);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1];
  return {
    blob: await response.blob(),
    filename,
    contentType: response.headers.get("Content-Type") ?? undefined
  };
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
  const session = (await parseResponse<AuthSession>(response)).data;
  saveSession(session);
  return session;
}

async function rawFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { retryOnUnauthorized: _retryOnUnauthorized, headers, ...fetchOptions } = options;
  const accessToken = getAccessToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    cache: fetchOptions.cache ?? "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers
    }
  });
}

async function parseResponse<T, M = Record<string, unknown> | undefined>(
  response: Response
): Promise<ApiEnvelope<T, M>> {
  if (response.status === 204) {
    return { data: undefined as T };
  }

  const body = (await response.json().catch(() => ({}))) as SuccessEnvelope<T> &
    ErrorEnvelope;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error?.code ?? "api.request_failed",
      body.error?.message ?? "Request failed",
      body.error?.details
    );
  }

  return {
    data: body.data,
    meta: body.meta as M
  };
}
