"use client";

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
    <button className="button button--secondary" onClick={handleLogout} type="button">
      Sair
    </button>
  );
}
