import { ChevronRight, Leaf, Plus } from "lucide-react";

import { createClient } from "@/core/supabase/server";
import { listDiagnoses } from "@/features/diagnoses";

function StatusPill({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Completed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
      Pending
    </span>
  );
}

export default async function DiagnosesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const diagnoses = user ? await listDiagnoses(user.id) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Leaf size={20} className="text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-primary">Crop Diagnoses</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered diagnosis for crop problems and diseases
          </p>
        </div>
        <a
          href="/dashboard/diagnoses/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md"
        >
          <Plus size={15} />
          New Diagnosis
        </a>
      </div>

      {/* Empty state */}
      {diagnoses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Leaf size={24} className="text-primary" />
          </div>
          <h3 className="font-semibold text-primary">No diagnoses yet</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Describe a crop problem and get expert AI advice tailored to Zimbabwe&apos;s farming
            regions.
          </p>
          <a
            href="/dashboard/diagnoses/new"
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
          >
            <Plus size={14} />
            Start your first diagnosis
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {diagnoses.map((diagnosis) => (
            <a
              key={diagnosis.id}
              href={`/dashboard/diagnoses/${diagnosis.id}`}
              className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Leaf size={18} className="text-primary" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{diagnosis.cropType}</p>
                  <StatusPill status={diagnosis.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{diagnosis.region}</p>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {diagnosis.description}
                </p>
              </div>

              {/* Date + chevron */}
              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(diagnosis.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <ChevronRight
                  size={16}
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
