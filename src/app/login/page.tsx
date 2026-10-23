"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Truck, ArrowRight, AlertCircle, Lock, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());

    // Check if user already has an active session
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace(redirectedFrom);
        }
      });
    }
  }, [redirectedFrom, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return; // Prevent duplicate submissions

    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Staff email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    if (!isConfigured) {
      setIsLoading(false);
      setErrors({
        general:
          "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are missing in .env.local. Live authentication requires active credentials.",
      });
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsLoading(false);
        setErrors({ general: error.message });
        return;
      }

      if (data?.session) {
        // Successful login
        router.push(redirectedFrom);
        router.refresh();
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : "An unexpected error occurred during login.";
      setErrors({ general: message });
    }
  };

  return (
    <div className="bg-white py-8 px-5 sm:px-8 shadow-xs border border-slate-200/80 rounded-2xl">
      {/* Status notice */}
      {!isConfigured ? (
        <div className="mb-6 rounded-lg bg-amber-50 p-3.5 border border-amber-200 flex items-start gap-2.5">
          <KeyRound className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-semibold block">Supabase Credentials Required</span>
            <p className="text-amber-700 leading-relaxed">
              Provide <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
              <code className="font-mono text-[11px]">.env.local</code> to enable live staff sign-in.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg bg-emerald-50 p-3 border border-emerald-200 flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-800 font-medium">
            Supabase Auth Connected • Email/Password ready
          </p>
        </div>
      )}

      {errors.general && (
        <div className="mb-6 rounded-lg bg-rose-50 p-3.5 border border-rose-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-800 font-medium">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="staff-email"
          label="Staff Email"
          type="email"
          autoComplete="email"
          placeholder="dispatcher@swiftdispatch.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          disabled={isLoading}
          required
        />

        <Input
          id="staff-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          disabled={isLoading}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-semibold"
            isLoading={isLoading}
            disabled={isLoading}
          >
            <span>Sign in to Dashboard</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </form>

      {!isConfigured && (
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 underline underline-offset-4"
          >
            Inspect Dashboard Layout (Local Preview Mode) &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Truck className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          SwiftDispatch Staff Login
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Delivery fleet management and staff operations portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-white py-12 px-8 shadow-xs border border-slate-200/80 rounded-2xl flex items-center justify-center">
              <span className="text-xs text-slate-400">Loading authentication form...</span>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center text-xs text-slate-400">
          SwiftDispatch v1.0 • Supabase Auth Integrated
        </div>
      </div>
    </div>
  );
}
