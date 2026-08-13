const LOCAL_API_BASE_URL = "http://localhost:8000/api/v1";

export function resolveApiBaseUrl(value = process.env.NEXT_PUBLIC_API_BASE_URL): string {
  const candidate = value?.trim() || LOCAL_API_BASE_URL;
  return candidate.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();
