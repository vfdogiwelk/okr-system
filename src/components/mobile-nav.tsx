"use client";

import { useState } from "react";
import { Target, LayoutDashboard, Network, ListTodo, Menu, X, Bell, Settings } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Мої OKR", icon: LayoutDashboard },
  { href: "/tasks", label: "Мої задачі", icon: ListTodo },
  { href: "/company", label: "OKR компанії", icon: Network },
  { href: "/notifications", label: "Сповіщення", icon: Bell, badgeKey: "unreadCount" as const },
  { href: "/settings", label: "Налаштування", icon: Settings },
];

export function MobileNav({ userName, userRole, unreadCount = 0 }: { userName: string; userRole: string; unreadCount?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#6c5ce7] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">OKR System</div>
            <div className="text-xs text-gray-400">{userName} &middot; {userRole}</div>
          </div>
        </div>
        <button onClick={() => setOpen(!open)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
          {open ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="lg:hidden fixed top-[60px] left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-xl p-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium">
                <item.icon className="w-5 h-5" />{item.label}
                {"badgeKey" in item && unreadCount > 0 && (
                  <span className="ml-auto text-xs font-bold bg-[#6c5ce7] text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
