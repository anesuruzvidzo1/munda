import { AlertCircle, BarChart2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";

import { createClient } from "@/core/supabase/server";
import {
  getYieldPrediction,
  YieldPredictionAccessDeniedError,
  YieldPredictionNotFoundError,
} from "@/features/yield-predictions";

interface PageProps {
  params: Promise<{ id: string }>;
}

function YieldCategoryDisplay({ category }: { category: string | null }) {
  if (category === "high") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-primary">
        <TrendingUp size={18} />
        <span className="text-sm font-bold">High Yield Expected</span>
      </div>
    );
  }
  if (category === "medium") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Minus size={18} />
        <span className="text-sm font-bold">Medium Yield Expected</span>
      </div>
    );
  }
  if (category === "low") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-destructive">
        <TrendingDown size={18} />
        <span className="text-sm font-bold">Low Yield Expected</span>
      </div>
    );
  }
  return null;
}

export default async function PredictionPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { id } = await params;

  try {
    const prediction = await getYieldPrediction(id, user.id);

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Back link */}
        <a
          href="/dashboard/predictions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Predictions
        </a>

        {/* Header card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <BarChart2 size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">
                {prediction.cropType} Yield Forecast
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{prediction.region}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Generated{" "}
                {new Date(prediction.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Soil inputs summary */}
          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Soil Inputs Used
            </p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Nitrogen", value: prediction.nitrogen, unit: "kg/ha" },
                { label: "Phosphorus", value: prediction.phosphorus, unit: "kg/ha" },
                { label: "Potassium", value: prediction.potassium, unit: "kg/ha" },
                { label: "Soil pH", value: prediction.pH, unit: "" },
              ].map(({ label, value, unit }) => (
                <div key={label} className="rounded-lg bg-muted p-3 text-center">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 text-sm font-bold text-foreground">
                    {value}
                    {unit && (
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                        {unit}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Yield result */}
        {prediction.status === "completed" && prediction.predictedYield && (
          <div className="space-y-4">
            {/* Big yield number */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Predicted Yield
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <span className="text-6xl font-black text-primary">
                    {parseFloat(prediction.predictedYield).toFixed(1)}
                  </span>
                  <span className="ml-2 text-xl font-medium text-muted-foreground">t/ha</span>
                </div>
                <YieldCategoryDisplay category={prediction.yieldCategory} />
              </div>
            </div>

            {/* AI recommendations */}
            {prediction.aiAnalysis && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-base font-bold text-primary">Recommendations</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Powered by Claude
                  </span>
                </div>
                <div className="space-y-3">
                  {prediction.aiAnalysis.split("\n").map((line) => {
                    if (!line.trim()) {
                      return null;
                    }
                    const clean = line.replace(/^[-•*]\s*/, "").trim();
                    return (
                      <div key={clean.slice(0, 50)} className="flex gap-3 rounded-lg bg-muted p-3">
                        <span className="mt-0.5 flex-shrink-0 text-sm text-amber-500">→</span>
                        <p className="text-sm leading-relaxed text-foreground">{clean}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  AI-generated for guidance only. Consult your local Agritex officer for
                  confirmation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Failed state */}
        {prediction.status === "failed" && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-destructive" />
            <p className="font-medium text-destructive">Prediction failed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The AI could not complete this prediction. Please try again.
            </p>
            <a
              href="/dashboard/predictions/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <BarChart2 size={14} />
              Try again
            </a>
          </div>
        )}

        {/* Pending state */}
        {prediction.status === "pending" && (
          <div className="rounded-xl border bg-card p-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="font-medium text-primary">Generating your forecast...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our AI is analysing your soil data. This takes 5–15 seconds.
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    if (
      error instanceof YieldPredictionNotFoundError ||
      error instanceof YieldPredictionAccessDeniedError
    ) {
      notFound();
    }
    throw error;
  }
}
