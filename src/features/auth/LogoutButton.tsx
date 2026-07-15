"use client";

import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <Button color="light" onClick={handleLogout} type="button">
      Sair
    </Button>
  );
}
