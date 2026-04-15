import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/core/supabase/server";

interface AuthLayoutProps {
  children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand + agriculture theme */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
        style={{ background: "var(--brand)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold"
            style={{ background: "var(--amber)", color: "var(--brand)" }}
          >
            M
          </div>
          <span className="text-xl font-bold tracking-wide text-white">MUNDA</span>
        </div>

        {/* Centre content */}
        <div className="space-y-6">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "var(--brand-mid)", color: "var(--amber)" }}
          >
            🌱 Field Intelligence Platform
          </div>
          <h2 className="text-4xl font-bold leading-tight text-white">
            Better harvests start with
            <br />
            better information.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "oklch(0.78 0.04 152)" }}>
            Munda brings expert crop diagnosis and yield forecasting to every field in Zimbabwe —
            powered by AI, built for smallholder farmers.
          </p>

          {/* Feature list */}
          <ul className="space-y-3">
            {[
              "Diagnose crop diseases and pest problems instantly",
              "Predict yield based on your soil's NPK and pH",
              "Get advice tailored to Zimbabwe's farming regions",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span style={{ color: "var(--amber)" }} className="mt-0.5 text-base">
                  ✓
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "oklch(0.82 0.04 152)" }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer quote */}
        <blockquote className="space-y-2 border-l-2 pl-4" style={{ borderColor: "var(--amber)" }}>
          <p className="text-sm italic leading-relaxed" style={{ color: "oklch(0.72 0.04 152)" }}>
            &ldquo;Munda — the word for &lsquo;field&rsquo; in Shona — is where life begins for
            millions of Zimbabwean families.&rdquo;
          </p>
        </blockquote>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ background: "var(--brand)" }}
            >
              M
            </div>
            <span className="text-lg font-bold tracking-wide" style={{ color: "var(--brand)" }}>
              MUNDA
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
