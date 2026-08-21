import Link from "next/link";

const features = [
  {
    title: "When to plant and harvest",
    body: "Timing guidance for your crop and your conditions, not generic tips.",
  },
  {
    title: "Disease watch",
    body: "Know what to look for before it costs you a season.",
  },
  {
    title: "Plain language advice",
    body: "Ask in your own words and get an answer you can act on.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold">Munda</span>
        <Link
          href="/login"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Farming guidance that fits your field.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Munda gives smallholder farmers plain language advice on when to plant, when to harvest,
          and what diseases to watch for, built around local growing conditions.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-5 py-2.5 font-medium transition-colors hover:bg-muted"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-border p-5">
            <h2 className="font-medium">{feature.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Munda
        </div>
      </footer>
    </main>
  );
}
