import { BarChart2, LayoutDashboard, Leaf } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/core/supabase/server";
import { signOut } from "@/features/auth/actions";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation bar */}
      <header style={{ background: "var(--brand)" }} className="sticky top-0 z-50 shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="/dashboard" className="flex items-center gap-2.5 group">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-transform duration-200 group-hover:scale-105"
                style={{ background: "var(--amber)", color: "var(--brand)" }}
              >
                M
              </div>
              <span className="text-base font-bold tracking-widest text-white">MUNDA</span>
            </a>

            {/* Nav links */}
            <nav className="hidden items-center gap-1 sm:flex">
              <a
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-all duration-150 hover:bg-white/10 hover:text-white"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </a>
              <a
                href="/dashboard/diagnoses"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-all duration-150 hover:bg-white/10 hover:text-white"
              >
                <Leaf size={15} />
                Diagnoses
              </a>
              <a
                href="/dashboard/predictions"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-all duration-150 hover:bg-white/10 hover:text-white"
              >
                <BarChart2 size={15} />
                Yield Predictions
              </a>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-white/50 sm:block">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 ring-1 ring-white/20 transition-all duration-150 hover:bg-white/10 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
