"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Create Test", href: "/dashboard/tests/create" },
    { name: "Students", href: "/dashboard/students" },
    { name: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="w-64 h-screen bg-[#15a083] text-white p-4">
      <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
      <nav className="flex flex-col space-y-4">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
