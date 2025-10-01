"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    if (!res.ok) {
      console.error("Logout failed", await res.text());
      return;
    }

    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="primary_btn">
      Logout
    </button>
  );
}