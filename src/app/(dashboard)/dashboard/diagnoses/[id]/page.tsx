import { AlertCircle, Leaf, Phone, Shield, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { createClient } from "@/core/supabase/server";
import {
  DiagnosisAccessDeniedError,
  DiagnosisNotFoundError,
  getDiagnosis,
} from "@/features/diagnoses";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface AdviceSection {
  title: string;
  content: string;
}

/** Parse the structured AI advice into labelled sections. */
function parseAdviceSections(text: string): AdviceSection[] | null {
  const pattern = /(?:^|\n)\*{0,2}#{0,3}\s*\d+\.\s+([^\n*#]+)\*{0,2}/g;
  const matches = [...text.matchAll(pattern)];
  if (matches.length < 2) {
    return null;
  }
  return matches.map((match, i) => {
    const nextMatch = matches[i + 1];
    const start = (match.index ?? 0) + match[0].length;
    const end = nextMatch ? (nextMatch.index ?? text.length) : text.length;
    return {
      title: (match[1] ?? "").trim().replace(/[*#]/g, ""),
      content: text.slice(start, end).trim(),
    };
  });
}

/**
 * Shared markdown component map — renders AI markdown output with design-system
 * styles that adapt to both light and dark mode via CSS variables.
 */
const md = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 text-sm leading-relaxed text-foreground last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-foreground">{children}</em>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-2 mt-5 text-base font-bold text-foreground first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-2 mt-4 text-sm font-bold text-foreground first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-1 mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-foreground">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-foreground">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed text-foreground">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-3 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-border bg-muted px-3 py-2 text-left text-xs font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-border px-3 py-2 text-sm text-foreground last:border-b-0">
      {children}
    </td>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  ),
  hr: () => <hr className="my-4 border-border" />,
};

/**
 * Section definitions — Tailwind classes only, so dark: variants work correctly.
 * No hardcoded oklch values in inline styles.
 */
const SECTION_META = [
  {
    icon: AlertCircle,
    iconClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/40",
    borderClass: "border-red-200 dark:border-red-800",
    titleClass: "text-red-700 dark:text-red-300",
  },
  {
    icon: Zap,
    iconClass: "text-emerald-700 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    titleClass: "text-emerald-800 dark:text-emerald-300",
  },
  {
    icon: Shield,
    iconClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/40",
    borderClass: "border-sky-200 dark:border-sky-800",
    titleClass: "text-sky-700 dark:text-sky-300",
  },
  {
    icon: Phone,
    iconClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
    borderClass: "border-amber-200 dark:border-amber-800",
    titleClass: "text-amber-700 dark:text-amber-300",
  },
];

function StatusPill({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Completed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
      Pending
    </span>
  );
}

export default async function DiagnosisPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { id } = await params;

  try {
    const diagnosis = await getDiagnosis(id, user.id);
    const sections = diagnosis.aiAdvice ? parseAdviceSections(diagnosis.aiAdvice) : null;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Back link */}
        <a
          href="/dashboard/diagnoses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Diagnoses
        </a>

        {/* Header card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Leaf size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">{diagnosis.cropType} Diagnosis</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{diagnosis.region}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(diagnosis.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <StatusPill status={diagnosis.status} />
          </div>

          {/* Description */}
          <div className="mt-5 rounded-lg border-l-2 border-border bg-muted p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reported Problem
            </p>
            <p className="text-sm leading-relaxed text-foreground">{diagnosis.description}</p>
          </div>
        </div>

        {/* AI Advisory — structured sections */}
        {diagnosis.status === "completed" && diagnosis.aiAdvice && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-primary">AI Advisory Report</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Powered by Claude
              </span>
            </div>

            {sections ? (
              /* Structured view — one card per section */
              sections.map((section, i) => {
                // biome-ignore lint/style/noNonNullAssertion: modulo guarantees valid index within fixed-length array
                const meta = SECTION_META[i % SECTION_META.length]!;
                const Icon = meta.icon;
                return (
                  <div
                    key={section.title}
                    className={`rounded-xl border p-5 shadow-sm ${meta.bgClass} ${meta.borderClass}`}
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <Icon size={16} className={meta.iconClass} />
                      <h3 className={`text-sm font-bold ${meta.titleClass}`}>{section.title}</h3>
                    </div>
                    <ReactMarkdown components={md}>{section.content}</ReactMarkdown>
                  </div>
                );
              })
            ) : (
              /* Fallback — full markdown render */
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <ReactMarkdown components={md}>{diagnosis.aiAdvice}</ReactMarkdown>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              AI-generated for guidance only. Consult your local Agritex officer for confirmation.
            </p>
          </div>
        )}

        {/* Failed state */}
        {diagnosis.status === "failed" && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-destructive" />
            <p className="font-medium text-destructive">Analysis failed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The AI could not complete this diagnosis. Please try again.
            </p>
            <a
              href="/dashboard/diagnoses/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Leaf size={14} />
              Try again
            </a>
          </div>
        )}

        {/* Pending state */}
        {diagnosis.status === "pending" && (
          <div className="rounded-xl border bg-card p-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="font-medium text-primary">Analysing your crop...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our AI is reviewing your description. This takes 5–15 seconds.
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    if (error instanceof DiagnosisNotFoundError || error instanceof DiagnosisAccessDeniedError) {
      notFound();
    }
    throw error;
  }
}
