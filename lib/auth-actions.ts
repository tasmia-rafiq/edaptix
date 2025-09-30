"use server";

import { signIn , signOut} from "@/auth";

export async function signInWithGoogle(role: "student" | "teacher") {
  const callbackUrl = `/auth/role?role=${role}`;
  await signIn("google", { callbackUrl });
}

export async function signOutSession() {
    await signOut({ redirectTo: "/" });
}