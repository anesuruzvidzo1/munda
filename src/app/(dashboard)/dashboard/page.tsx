import { BarChart2, ChevronRight, Leaf } from "lucide-react";

import { createClient } from "@/core/supabase/server";
import { getDiagnosisCount } from "@/features/diagnoses";
import { getYieldPredictionCount } from "@/features/yield-predictions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [diagnosisCount, predictionCount] = await Promise.all([
    user ? getDiagnosisCount(user.id) : Promise.resolve(0),
    user ? getYieldPredictionCount(user.id) : Promise.resolve(0),
  ]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning";
    }
    if (hour < 17) {
      return "Good afternoon";
    }
    return "Good evening";
  })();

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-amber-500 dark:text-amber-400">{greeting}</p>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Your Field Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered crop advisory for Zimbabwean smallholder farmers
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Diagnoses stat */}
        <div className="rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Crop Diagnoses</p>
              <p className="mt-1 text-4xl font-bold text-primary">{diagnosisCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {diagnosisCount === 1 ? "diagnosis" : "diagnoses"} submitted
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Leaf size={20} className="text-primary" />
            </div>
          </div>
        </div>

        {/* Predictions stat */}
        <div className="rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Yield Predictions</p>
              <p className="mt-1 text-4xl font-bold text-primary">{predictionCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {predictionCount === 1 ? "forecast" : "forecasts"} generated
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <BarChart2 size={20} className="text-primary" />
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-medium text-muted-foreground">Account</p>
          <p className="mt-2 truncate font-medium text-foreground">{user?.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Member since{" "}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-primary">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* New Diagnosis CTA */}
          <a
            href="/dashboard/diagnoses/new"
            className="group flex items-center justify-between rounded-xl border-2 border-primary bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-transform duration-200 group-hover:scale-105">
                <Leaf size={22} />
              </div>
              <div>
                <p className="font-semibold text-primary">Diagnose a Crop Problem</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Describe symptoms, get instant AI advice
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>

          {/* New Prediction CTA */}
          <a
            href="/dashboard/predictions/new"
            className="group flex items-center justify-between rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-transform duration-200 group-hover:scale-105">
                <BarChart2 size={22} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Predict Crop Yield</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Enter soil data for a yield forecast
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>

      {/* Recent activity links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="/dashboard/diagnoses"
          className="group flex items-center justify-between rounded-xl border bg-card px-5 py-4 text-sm font-medium transition-all duration-150 hover:border-primary/40 hover:shadow-sm"
        >
          <span className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
            <Leaf size={14} />
            View all diagnoses
          </span>
          <ChevronRight size={14} className="text-muted-foreground" />
        </a>
        <a
          href="/dashboard/predictions"
          className="group flex items-center justify-between rounded-xl border bg-card px-5 py-4 text-sm font-medium transition-all duration-150 hover:border-primary/40 hover:shadow-sm"
        >
          <span className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
            <BarChart2 size={14} />
            View all predictions
          </span>
          <ChevronRight size={14} className="text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}
