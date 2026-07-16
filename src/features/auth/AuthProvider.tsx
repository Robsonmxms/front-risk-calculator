"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  getCurrentUser,
  loginWithGoogle,
  loginWithPassword,
  logout as logoutRequest
} from "./authApi";
import {
  clearSession,
  getAccessToken,
  getSelectedOfficeId,
  getStoredActor,
  saveSelectedOfficeId
} from "./sessionStore";
import { Actor, LoginCredentials, OfficeMembershipSummary } from "./types";

type AuthStatus = "loading" | "guest" | "authenticated" | "expired";

interface AuthContextValue {
  status: AuthStatus;
  actor: Actor | null;
  activeOffice: OfficeMembershipSummary | null;
  officeMemberships: OfficeMembershipSummary[];
  selectOffice: (officeId: string) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogleCredential: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [actor, setActor] = useState<Actor | null>(null);
  const [activeOffice, setActiveOffice] = useState<OfficeMembershipSummary | null>(null);

  const applyActor = useCallback((nextActor: Actor | null) => {
    setActor(nextActor);
    if (!nextActor) {
      setActiveOffice(null);
      return;
    }

    const storedOfficeId = getSelectedOfficeId();
    const selectedOffice =
      nextActor.officeMemberships.find((office) => office.officeId === storedOfficeId) ??
      nextActor.officeMemberships[0] ??
      null;
    setActiveOffice(selectedOffice);
    if (selectedOffice) {
      saveSelectedOfficeId(selectedOffice.officeId);
    }
  }, []);

  const refreshBootstrap = useCallback(async () => {
    const storedActor = getStoredActor();
    const accessToken = getAccessToken();

    if (!accessToken) {
      applyActor(null);
      setStatus("guest");
      return;
    }

    if (storedActor) {
      applyActor(storedActor);
      setStatus("authenticated");
    }

    try {
      const currentUser = await getCurrentUser();
      applyActor(currentUser.actor);
      setStatus("authenticated");
    } catch {
      clearSession();
      applyActor(null);
      setStatus("expired");
    }
  }, [applyActor]);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await loginWithPassword(credentials);
    applyActor(session.actor);
    setStatus("authenticated");
  }, [applyActor]);

  const loginWithGoogleCredential = useCallback(async (credential: string) => {
    const session = await loginWithGoogle({ idToken: credential });
    applyActor(session.actor);
    setStatus("authenticated");
  }, [applyActor]);

  const logout = useCallback(async () => {
    await logoutRequest();
    applyActor(null);
    setStatus("guest");
  }, [applyActor]);

  const selectOffice = useCallback(
    (officeId: string) => {
      const office = actor?.officeMemberships.find((entry) => entry.officeId === officeId) ?? null;
      if (!office) {
        return;
      }

      saveSelectedOfficeId(office.officeId);
      setActiveOffice(office);
    },
    [actor?.officeMemberships]
  );

  const value = useMemo(
    () => ({
      status,
      actor,
      activeOffice,
      officeMemberships: actor?.officeMemberships ?? [],
      selectOffice,
      login,
      loginWithGoogleCredential,
      logout,
      refreshBootstrap
    }),
    [
      activeOffice,
      actor,
      login,
      loginWithGoogleCredential,
      logout,
      refreshBootstrap,
      selectOffice,
      status
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
