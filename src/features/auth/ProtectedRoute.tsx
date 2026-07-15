"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { UserRole } from "./types";

export function ProtectedRoute({
  children,
  roles
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const router = useRouter();
  const { actor, status } = useAuth();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }

    if (status === "expired") {
      router.replace("/session-expired");
    }

    if (status === "authenticated" && roles && actor && !roles.includes(actor.role)) {
      router.replace("/unauthorized");
    }
  }, [actor, roles, router, status]);

  if (status === "loading" || status === "guest" || status === "expired") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10 text-stone-700">
        Carregando sessao...
      </main>
    );
  }

  if (roles && actor && !roles.includes(actor.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10 text-stone-700">
        Acesso nao autorizado.
      </main>
    );
  }

  return <>{children}</>;
}
