"use client";

import { useEffect, useState } from "react";

type Student = {
  _id: string;
  name: string;
  email: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/users/students");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch students");
        } else {
          setStudents(data);
        }
      } catch (err) {
        console.error(err);
        setError("Network error, please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6 text-red-600">Access Denied</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">All Students</h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((s) => (
                <tr key={s._id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-700">{s._id}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">{s.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{s.email}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
