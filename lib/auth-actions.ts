"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google", { callbackUrl: "/auth/complete" });
}

export async function signOutSession() {
  await signOut({ redirectTo: "/" });
}