import { BarChart2, ChevronRight, Plus, TrendingDown, TrendingUp } from "lucide-react";

import { createClient } from "@/core/supabase/server";
import { listYieldPredictions } from "@/features/yield-predictions";

function YieldBadge({ category }: { category: string | null }) {
  if (category === "high") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
        <TrendingUp size={11} />
        High
      </span>
    );
  }
  if (category === "medium") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <BarChart2 size={11} />
        Medium
      </span>
    );
  }
  if (category === "low") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
        <TrendingDown size={11} />
        Low
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Pending
    </span>
  );
}

export default async function PredictionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const predictions = user ? await listYieldPredictions(user.id) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart2 size={20} className="text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-primary">Yield Predictions</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Soil-based yield forecasts powered by AI
          </p>
        </div>
        <a
          href="/dashboard/predictions/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md"
        >
          <Plus size={15} />
          New Prediction
        </a>
      </div>

      {/* Empty state */}
      {predictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <BarChart2 size={24} className="text-primary" />
          </div>
          <h3 className="font-semibold text-primary">No predictions yet</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Enter your soil&apos;s NPK and pH values to get an AI-powered yield forecast for your
            crop.
          </p>
          <a
            href="/dashboard/predictions/new"
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
          >
            <Plus size={14} />
            Generate your first prediction
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((prediction) => (
            <a
              key={prediction.id}
              href={`/dashboard/predictions/${prediction.id}`}
              className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BarChart2 size={18} className="text-primary" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{prediction.cropType}</p>
                  <YieldBadge category={prediction.yieldCategory} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{prediction.region}</p>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span>N: {prediction.nitrogen}</span>
                  <span>P: {prediction.phosphorus}</span>
                  <span>K: {prediction.potassium}</span>
                  <span>pH: {prediction.pH}</span>
                </div>
              </div>

              {/* Yield + date */}
              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                {prediction.predictedYield && (
                  <p className="text-sm font-bold text-primary">
                    {parseFloat(prediction.predictedYield).toFixed(1)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">t/ha</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(prediction.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground/50 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
