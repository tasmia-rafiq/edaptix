"use client";

import Sidebar from "@/components/Sidebar";
import StudentList from "@/components/StudentList";

export default function DashboardPage() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <StudentList />
      </div>
    </div>
  );
}
