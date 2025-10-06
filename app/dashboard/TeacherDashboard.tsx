import React from "react";
import Sidebar from "@/components/Sidebar";
import StudentList from "@/components/StudentList";
import AllTests from "@/components/AllTests";

export default function TeacherDashboard({ session }: { session: any }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar role={session.role}/>

      {/* Main content */}
      <div className="flex-1 p-8">
        <div> 
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-base text-slate-500 mt-2">
            Welcome back, {session?.name ?? "Teacher"}
          </p>
        </div>


        <section className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Your Created Tests</h2>
            <p className="text-base text-slate-500">
              Manage tests, publish, and review student attempts.
            </p>
          </div>

          <AllTests teacherId={String(session._id)} />
        </section>
      </div>
    </div>
  );
}
