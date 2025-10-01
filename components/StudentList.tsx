"use client";

const dummyStudents = [
  { id: 1, name: "Ali Khan", email: "ali.khan@example.com" },
  { id: 2, name: "Sara Ahmed", email: "sara.ahmed@example.com" },
  { id: 3, name: "Bilal Hussain", email: "bilal.h@example.com" },
];

export default function StudentList() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Students</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Email</th>
          </tr>
        </thead>
        <tbody>
          {dummyStudents.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{student.id}</td>
              <td className="px-4 py-2 border">{student.name}</td>
              <td className="px-4 py-2 border">{student.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
