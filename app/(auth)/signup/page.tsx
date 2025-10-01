import SignUpForm from "@/components/SignUpForm";
import { getCurrentUser } from "@/lib/session";
import { redirect } from 'next/navigation';

export default async function SignupPage() {

  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="min-h-screen bg-slate-50">
      <SignUpForm />
    </main>
  );
}
