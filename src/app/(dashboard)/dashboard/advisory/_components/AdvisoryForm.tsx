"use client";

import { Loader2, Send, Sprout } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdvisoryFormState {
  crop: string;
  location: string;
  season: string;
  problem: string;
}

const SEASONS = ["Rainy Season", "Dry Season", "Spring", "Summer", "Autumn", "Winter"];

const EXAMPLE_QUESTIONS = [
  {
    crop: "Maize",
    location: "Harare, Zimbabwe",
    season: "Rainy Season",
    problem:
      "My maize leaves are turning yellow from the bottom up. Plants are about 6 weeks old. What could be causing this and how do I fix it?",
  },
  {
    crop: "Tomatoes",
    location: "Lusaka, Zambia",
    season: "Dry Season",
    problem:
      "I notice brown spots with yellow rings on my tomato leaves. Some fruits are also developing dark sunken spots at the bottom.",
  },
  {
    crop: "Cassava",
    location: "Lagos, Nigeria",
    season: "Rainy Season",
    problem:
      "My cassava plants are stunted and the leaves are showing mosaic patterns. What disease is this and what should I do?",
  },
];

export function AdvisoryForm() {
  const [form, setForm] = useState<AdvisoryFormState>({
    crop: "",
    location: "",
    season: "Rainy Season",
    problem: "",
  });
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function loadExample(index: number) {
    const example = EXAMPLE_QUESTIONS[index];
    if (example) {
      setForm(example);
      setResponse("");
      setSubmitted(false);
    }
  }

  async function readStream(body: ReadableStream<Uint8Array>, onChunk: (text: string) => void) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      onChunk(decoder.decode(value, { stream: true }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.crop.trim() || !form.problem.trim()) {
      return;
    }

    setLoading(true);
    setResponse("");
    setSubmitted(true);

    try {
      const res = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok || !res.body) {
        setResponse("Sorry, something went wrong. Please try again.");
        return;
      }

      let accumulated = "";
      await readStream(res.body, (text) => {
        accumulated += text;
        setResponse(accumulated);
      });
    } catch {
      setResponse("Connection error. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            Ask the Advisor
          </CardTitle>
          <CardDescription>
            Describe your crop, location, and the problem you are facing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((ex, i) => (
                <button
                  key={ex.crop}
                  type="button"
                  onClick={() => loadExample(i)}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                >
                  {ex.crop}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="crop">Crop</Label>
                <Input
                  id="crop"
                  placeholder="e.g. Maize, Tomatoes"
                  value={form.crop}
                  onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location / Region</Label>
                <Input
                  id="location"
                  placeholder="e.g. Harare, Zimbabwe"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="season">Growing Season</Label>
              <select
                id="season"
                value={form.season}
                onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="problem">Problem or Question</Label>
              <Textarea
                id="problem"
                placeholder="Describe the issue you are seeing — symptoms, when it started, how many plants are affected..."
                value={form.problem}
                onChange={(e) => setForm((f) => ({ ...f, problem: e.target.value }))}
                className="min-h-[120px] resize-none"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting advice...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Get Advice
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advisory Response</CardTitle>
          <CardDescription>AI-powered recommendations from Munda</CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted && !response && (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <Sprout className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">
                Fill in your crop details and describe your problem to get personalized advice.
              </p>
            </div>
          )}

          {loading && !response && (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 mb-3 animate-spin opacity-40" />
              <p className="text-sm">Analyzing your situation...</p>
            </div>
          )}

          {response && (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
                {response}
                {loading && (
                  <span className="inline-block w-2 h-4 bg-foreground ml-1 animate-pulse" />
                )}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
