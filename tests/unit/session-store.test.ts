import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSelectedOfficeId,
  getStoredActor,
  saveSelectedOfficeId,
  saveSession,
  updateAccessToken
} from "../../src/features/auth/sessionStore";
import { AuthSession } from "../../src/features/auth/types";

const actor: AuthSession["actor"] = {
  id: "usr_user",
  email: "user@risk.local",
  name: "Usuario",
  role: "user",
  officeMemberships: [],
  accountMemberships: []
};

describe("sessionStore", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("stores access token and actor in session storage while keeping refresh token in memory", () => {
    const listener = vi.fn();
    window.addEventListener("auth-session-changed", listener);

    saveSession({
      accessToken: "access-one",
      refreshToken: "refresh-one",
      actor
    });
    updateAccessToken("access-two");
    saveSelectedOfficeId("ofc_main");

    expect(getAccessToken()).toBe("access-two");
    expect(getRefreshToken()).toBe("refresh-one");
    expect(getStoredActor()).toEqual(actor);
    expect(getSelectedOfficeId()).toBe("ofc_main");
    expect(window.sessionStorage.getItem("risk_calculator.actor")).toContain("user@risk.local");
    expect(window.localStorage.length).toBe(0);
    expect(listener).toHaveBeenCalled();

    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getStoredActor()).toBeNull();
    expect(getSelectedOfficeId()).toBeNull();
  });

  it("rehydrates stored actors and clears malformed actor payloads", () => {
    window.sessionStorage.setItem("risk_calculator.actor", JSON.stringify(actor));

    expect(getStoredActor()).toEqual(actor);

    clearSession();
    window.sessionStorage.setItem("risk_calculator.actor", "{invalid-json");

    expect(getStoredActor()).toBeNull();
    expect(window.sessionStorage.getItem("risk_calculator.actor")).toBeNull();
  });
});
