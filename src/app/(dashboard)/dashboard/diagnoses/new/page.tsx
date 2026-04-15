"use client";

import { Leaf, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CROP_TYPES, ZIMBABWE_REGIONS } from "@/features/diagnoses/constants";

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function NewDiagnosisPage() {
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
      description: formData.get("description") as string,
    };

    try {
      const response = await fetch("/api/diagnoses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      const diagnosis = (await response.json()) as { id: string };
      router.push(`/dashboard/diagnoses/${diagnosis.id}`);
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
          href="/dashboard/diagnoses"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Diagnoses
        </a>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Leaf size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">New Crop Diagnosis</h1>
            <p className="text-sm text-muted-foreground">
              Describe your problem and get expert AI advice
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Describe the problem
            </Label>
            <Textarea
              id="description"
              name="description"
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              className="resize-none rounded-lg text-sm leading-relaxed"
              placeholder="Describe what you are seeing — for example: leaves turning yellow from the bottom up, white powder on stems, stunted growth despite adequate watering, spots appearing on leaves..."
            />
            <p className="text-xs text-muted-foreground">
              Include when you first noticed the symptoms, how much of the crop is affected, and any
              recent weather or treatment changes.
            </p>
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
                  Analysing crop...
                </>
              ) : (
                <>
                  <Leaf size={16} />
                  Get Diagnosis
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/diagnoses")}
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
          <strong>Tip:</strong> The more detail you provide — symptoms, timing, affected area size —
          the more accurate and useful your diagnosis will be.
        </p>
      </div>
    </div>
  );
}
