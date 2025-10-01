import SignInForm from "@/components/SignInForm";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SigninPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="min-h-screen bg-slate-50">
      <SignInForm />
    </main>
  );
}
