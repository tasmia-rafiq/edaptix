import React from "react";
import AllAvailableTests from "@/components/AvailableTests";
import Sidebar from "@/components/Sidebar";

const StudentDashboard = ({ session }: { session: any }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={session.role}/>

      <div className="flex-1 p-8">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-base text-slate-500 mt-2">
            Welcome back, {session?.name ?? "Student"}
          </p>
        </div>


      <h1 className="text-2xl font-bold mb-6">Available Tests</h1>
      <AllAvailableTests studentId={String(session._id)}/>
      </div>
    </div>
  );
};

export default StudentDashboard;
