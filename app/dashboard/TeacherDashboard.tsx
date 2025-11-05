import React from "react";
import Sidebar from "@/components/Sidebar";
import AllTests from "@/components/AllTests";
import Link from "next/link";
import AllCourses from "@/components/AllCourses";

export default function TeacherDashboard({ session }: { session: any }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar role={session.role}/>

      {/* Main content */}
      <div className="flex-1 p-8">
        <div> 
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-base font-medium text-slate-500 mt-2">
            Welcome back, {session?.name ?? "Teacher"}!
          </p>
        </div>


        <section className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Your Created Tests</h2>
              <p className="text-base text-slate-500">
                Manage tests, publish, and review student attempts.
              </p>
            </div>

            <div>
              <Link
                href="/dashboard/create-test"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo text-white"
              >
                + New Test
              </Link>
            </div>
          </div>

          <AllTests teacherId={String(session._id)} />
        </section>

        {/* Courses */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Your Courses</h2>
              <p className="text-base text-slate-500">
                Manage and publish your courses. Edit lessons, pricing, and visibility.
              </p>
            </div>

            <div>
              <Link
                href="/dashboard/courses/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo text-white"
              >
                + New Course
              </Link>
            </div>
          </div>

          <AllCourses teacherId={String(session._id)} />
        </section>
      </div>
    </div>
  );
}
