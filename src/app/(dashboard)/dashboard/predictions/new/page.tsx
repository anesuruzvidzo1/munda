"use client";

import { BarChart2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CROP_TYPES, ZIMBABWE_REGIONS } from "@/features/diagnoses/constants";

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function SoilInput({
  id,
  label,
  unit,
  min,
  max,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  placeholder: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type="number"
          min={min}
          max={max}
          step="0.1"
          required
          placeholder={placeholder}
          className="h-11 rounded-lg pr-14"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          {unit}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function NewPredictionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const body = {
      cropType: formData.get("cropType") as string,
      region: formData.get("region") as string,
      nitrogen: Number(formData.get("nitrogen")),
      phosphorus: Number(formData.get("phosphorus")),
      potassium: Number(formData.get("potassium")),
      pH: Number(formData.get("pH")),
    };

    try {
      const response = await fetch("/api/yield-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      const prediction = (await response.json()) as { id: string };
      router.push(`/dashboard/predictions/${prediction.id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <a
          href="/dashboard/predictions"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Predictions
        </a>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart2 size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">New Yield Prediction</h1>
            <p className="text-sm text-muted-foreground">
              Enter your soil data to get an AI yield forecast
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Crop + Region */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cropType" className="text-sm font-medium">
                Crop type
              </Label>
              <select id="cropType" name="cropType" required className={selectClass}>
                <option value="">Select a crop...</option>
                {CROP_TYPES.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region" className="text-sm font-medium">
                Farming region
              </Label>
              <select id="region" name="region" required className={selectClass}>
                <option value="">Select a region...</option>
                {ZIMBABWE_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Soil nutrients */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Soil Nutrients
              </p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SoilInput
                id="nitrogen"
                label="Nitrogen (N)"
                unit="kg/ha"
                min={0}
                max={500}
                placeholder="e.g. 120"
              />
              <SoilInput
                id="phosphorus"
                label="Phosphorus (P)"
                unit="kg/ha"
                min={0}
                max={300}
                placeholder="e.g. 40"
              />
              <SoilInput
                id="potassium"
                label="Potassium (K)"
                unit="kg/ha"
                min={0}
                max={300}
                placeholder="e.g. 60"
              />
            </div>
          </div>

          {/* pH */}
          <div className="max-w-xs">
            <SoilInput
              id="pH"
              label="Soil pH"
              unit="pH"
              min={3}
              max={10}
              placeholder="e.g. 6.5"
              hint="Optimal range for most crops: 5.5–7.0"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating prediction...
                </>
              ) : (
                <>
                  <BarChart2 size={16} />
                  Predict Yield
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/predictions")}
              className="rounded-lg border px-5 py-3 text-sm font-medium text-foreground transition-all duration-150 hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Tip */}
      <div className="flex gap-3 rounded-xl bg-primary/8 p-4 text-sm text-primary">
        <span className="text-base">💡</span>
        <p>
          <strong>Don&apos;t have soil test results?</strong> Contact your local Agritex office for
          a subsidised soil test. The more accurate your inputs, the better your yield forecast.
        </p>
      </div>
    </div>
  );
}
