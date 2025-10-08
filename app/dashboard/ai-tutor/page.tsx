// app/dashboard/ai-tutor/page.tsx
import { getCurrentUser } from "@/lib/session";
import AiTutorClient from "@/components/AITutorClient";

export default async function AiTutorPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    return <div className="flex items-center justify-center min-h-screen">
    <h1 className="text-2xl font-semibold mb-6 text-red-600">Access Denied</h1>
    </div>;
  }

  return <AiTutorClient />;
}
