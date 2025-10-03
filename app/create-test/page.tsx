// app/dashboard/create-test/page.tsx
import CreateTestForm from "@/components/CreateTestForm";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CreateTestPage() {
  const user = await getCurrentUser();

  if (!user) {
    // not logged in
    redirect("/signin");
  }

  if ((user as any).role !== "teacher") {
    // not a teacher
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Create Test / Assessment</h1>
        <p className="text-sm text-slate-500 mb-6">
          Build an assessment for your students. Add questions and multiple options. Mark the correct option for automatic grading later.
        </p>

        {/* Client form */}
        <CreateTestForm />
      </div>
    </main>
  );
}
