"use client";

import { BookOpenCheck, Bot, ChartNoAxesCombined, LayoutDashboard, LibraryBig, PlusCircle, Settings, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({role}:{role:"teacher"|"student"}) {
  const pathname = usePathname();
  const teacherLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/dashboard/students", label: "Students", icon: <UsersRound /> },
    { href: "/dashboard/courses/create", label: "Create Course", icon: <PlusCircle /> },
    { href: "/dashboard/courses", label: "My Courses", icon: <LibraryBig /> },
    { href: "/dashboard/create-test", label: "Create Test", icon: <PlusCircle /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings /> },
    { href: "/dashboard/analytics", label: "Analytics", icon: <ChartNoAxesCombined /> }
  ];

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/dashboard/tests[id]", label: "Tests", icon: <BookOpenCheck /> },
    { href: "/dashboard/ai-tutor", label: "AI Tutor", icon: <Bot /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings /> }

  ];
  const links = role === "teacher"?teacherLinks:studentLinks;

  return (
    <div className="w-64 min-h-screen bg-gradient-to-tr from-indigo to-teal text-white p-4 pt-8">
      
      <nav className="flex flex-col space-y-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2"
          >
            {link.icon} {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
