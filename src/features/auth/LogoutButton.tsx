"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { useAuth } from "./AuthProvider";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <Button variant="outline" onClick={handleLogout} type="button">
      Sair
    </Button>
  );
}
