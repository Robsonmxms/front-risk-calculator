"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../components/ui/card";
import { useAuth } from "./AuthProvider";
import { UserRole } from "./types";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const router = useRouter();
  const { actor, status } = useAuth();
  const lastRedirectPath = useRef<string | null>(null);
  const rolesKey = roles?.join("|") ?? "";

  useEffect(() => {
    let redirectPath: string | null = null;

    if (status === "guest") {
      redirectPath = "/login";
    }

    if (status === "expired") {
      redirectPath = "/session-expired";
    }

    if (status === "authenticated" && roles && actor && !roles.includes(actor.role)) {
      redirectPath = "/unauthorized";
    }

    if (!redirectPath) {
      lastRedirectPath.current = null;
      return;
    }

    if (lastRedirectPath.current !== redirectPath) {
      lastRedirectPath.current = redirectPath;
      router.replace(redirectPath);
    }
  }, [actor, roles, rolesKey, router, status]);

  if (status === "loading" || status === "guest" || status === "expired") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <Card className="max-w-sm text-center text-stone-700" role="status">
          Carregando sessão...
        </Card>
      </main>
    );
  }

  if (roles && actor && !roles.includes(actor.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <Card className="max-w-sm text-center text-stone-700" role="alert">
          Acesso não autorizado.
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
