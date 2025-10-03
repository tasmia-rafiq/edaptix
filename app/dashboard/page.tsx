import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/signin");

  return (
    <>
      {session && session.role === "student" ? (
        <StudentDashboard session={session} 
        
        />
      ) : (
        <TeacherDashboard session={session} />
      )}
    </>
  );
}
