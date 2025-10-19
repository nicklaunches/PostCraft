"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface SidebarItem {
  label: string;
  href: string;
  icon?: string;
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const items: SidebarItem[] = [
    { label: "Dashboard", href: "/", icon: "📊" },
    { label: "Templates", href: "/templates", icon: "📝" },
  ];

  return (
    <div
      className={cn(
        "bg-gray-900 text-white transition-all duration-300",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header with toggle button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && <h1 className="text-xl font-bold">PostCraft</h1>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-gray-800 rounded"
          aria-label="Toggle sidebar"
        >
          {isOpen ? "◀" : "▶"}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="p-4 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-4 px-4 py-2 rounded-lg",
              "hover:bg-gray-800 transition-colors",
              isOpen ? "justify-start" : "justify-center"
            )}
            title={isOpen ? undefined : item.label}
          >
            {item.icon && <span className="text-lg">{item.icon}</span>}
            {isOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
