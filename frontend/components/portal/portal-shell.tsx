"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Menu, X, LogOut, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

export function PortalShell({
  role,
  title,
  subtitle,
  nav,
  active,
  onSelect,
  onLogout,
  children,
}: {
  role: "Lecturer" | "HOD";
  title: string;
  subtitle: string;
  nav: NavItem[];
  active: string;
  onSelect: (key: string) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const accent = role === "HOD" ? "text-emerald-600" : "text-indigo-600";

  const NavList = () => (
    <nav className="flex flex-col gap-1">
      {nav.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          data-testid={`portal-nav-${key}`}
          onClick={() => { onSelect(key); setOpen(false); }}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors text-left",
            active === key
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="portal-bg font-jakarta min-h-screen text-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="glass hidden w-[280px] flex-shrink-0 flex-col p-5 lg:flex">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight">GMIT Smart</p>
              <p className={cn("text-xs font-bold", accent)}>{role} Portal</p>
            </div>
          </div>
          <NavList />
          <button
            onClick={onLogout}
            data-testid="portal-logout"
            className="mt-auto flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {/* Mobile top bar */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button onClick={() => setOpen(true)} data-testid="portal-menu" className="glass rounded-xl p-2.5">
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm font-extrabold">{role} Portal</p>
            <button onClick={onLogout} className="glass rounded-xl p-2.5 text-rose-600">
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <header className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
          </header>

          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="glass absolute left-0 top-0 h-full w-[260px] p-5">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-extrabold">{role} Portal</p>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <NavList />
          </div>
        </div>
      )}
    </div>
  );
}

export function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass rounded-2xl p-5 shadow-sm", className)}>{children}</div>;
}
