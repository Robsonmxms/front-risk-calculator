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
import { getAccessToken, getStoredActor } from "./sessionStore";
import { Actor, LoginCredentials } from "./types";

type AuthStatus = "loading" | "guest" | "authenticated" | "expired";

interface AuthContextValue {
  status: AuthStatus;
  actor: Actor | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogleCredential: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [actor, setActor] = useState<Actor | null>(null);

  const refreshBootstrap = useCallback(async () => {
    const storedActor = getStoredActor();
    const accessToken = getAccessToken();

    if (!accessToken) {
      setActor(null);
      setStatus("guest");
      return;
    }

    if (storedActor) {
      setActor(storedActor);
      setStatus("authenticated");
    }

    try {
      const currentUser = await getCurrentUser();
      setActor(currentUser.actor);
      setStatus("authenticated");
    } catch {
      setActor(null);
      setStatus("expired");
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await loginWithPassword(credentials);
    setActor(session.actor);
    setStatus("authenticated");
  }, []);

  const loginWithGoogleCredential = useCallback(async (credential: string) => {
    const session = await loginWithGoogle({ idToken: credential });
    setActor(session.actor);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setActor(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({
      status,
      actor,
      login,
      loginWithGoogleCredential,
      logout,
      refreshBootstrap
    }),
    [actor, login, loginWithGoogleCredential, logout, refreshBootstrap, status]
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
