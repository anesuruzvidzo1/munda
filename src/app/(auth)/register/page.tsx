"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type RegisterState, register } from "./actions";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, initialState);

  if (state.success) {
    return (
      <div className="space-y-6">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ background: "oklch(0.90 0.06 150)", color: "var(--brand)" }}
        >
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
            Check your email
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        </div>
        <Link href="/login">
          <Button
            variant="outline"
            className="h-11 w-full rounded-lg border-2 font-semibold"
            style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
          >
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--brand)" }}>
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join thousands of Zimbabwean farmers using Munda
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {state.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="h-11 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            className="h-11 rounded-lg"
          />
          <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            className="h-11 rounded-lg"
          />
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
          style={{ background: "var(--brand)" }}
          disabled={isPending}
        >
          {isPending ? "Creating account..." : "Create Munda account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium underline-offset-4 hover:underline"
          style={{ color: "var(--brand)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
