"use client";

import { useEffect } from "react";
import { clearSession } from "./sessionStore";

export function SessionExpiredCleanup() {
  useEffect(() => {
    clearSession();
  }, []);

  return null;
}
