"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({role}:{role:"teacher"|"student"}) {
  const pathname = usePathname();
  const teacherLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/students", label: "Students" },
    { href: "/dashboard/create-test", label: "Create Test" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/tests[id]", label: "Tests" },
    { href: "/dashboard/settings", label: "Settings" },
  ];
  const links = role === "teacher"?teacherLinks:studentLinks;

  return (
    <div className="w-64 min-h-screen bg-gradient-to-tr from-indigo to-teal text-white p-4">
      
      <nav className="flex flex-col space-y-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
