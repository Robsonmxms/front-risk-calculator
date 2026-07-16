import { Actor, AuthSession } from "./types";

const ACCESS_TOKEN_KEY = "risk_calculator.access_token";
const ACTOR_KEY = "risk_calculator.actor";
const SELECTED_OFFICE_KEY = "risk_calculator.selected_office_id";

let refreshTokenMemory: string | null = null;
let actorMemory: Actor | null = null;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export function saveSession(session: AuthSession): void {
  refreshTokenMemory = session.refreshToken;
  actorMemory = session.actor;

  if (canUseStorage()) {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    window.sessionStorage.setItem(ACTOR_KEY, JSON.stringify(session.actor));
    window.dispatchEvent(new Event("auth-session-changed"));
  }
}

export function updateAccessToken(accessToken: string): void {
  if (canUseStorage()) {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return refreshTokenMemory;
}

export function getStoredActor(): Actor | null {
  if (actorMemory) {
    return actorMemory;
  }

  if (!canUseStorage()) {
    return null;
  }

  const serializedActor = window.sessionStorage.getItem(ACTOR_KEY);
  if (!serializedActor) {
    return null;
  }

  try {
    actorMemory = JSON.parse(serializedActor) as Actor;
    return actorMemory;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSelectedOfficeId(officeId: string): void {
  if (canUseStorage()) {
    window.sessionStorage.setItem(SELECTED_OFFICE_KEY, officeId);
  }
}

export function getSelectedOfficeId(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(SELECTED_OFFICE_KEY);
}

export function clearSession(): void {
  refreshTokenMemory = null;
  actorMemory = null;

  if (canUseStorage()) {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(ACTOR_KEY);
    window.sessionStorage.removeItem(SELECTED_OFFICE_KEY);
    window.dispatchEvent(new Event("auth-session-changed"));
  }
}
