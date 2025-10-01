"use client";

import React, { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Loader2, User2, Zap } from "lucide-react";

export default function SignInForm(): JSX.Element {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "same-origin",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Sign in failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: hero */}
        <section className="hidden lg:flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-tr from-teal to-indigo text-white shadow-lg">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
              <Zap size={18} />
              <span>Welcome back to Edaptix</span>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Learn, teach, and grow with AI-assisted feedback.
          </h1>
          <p className="text-sky-100/90 mb-6">
            Teachers upload lessons & assessments. Students take courses, get AI-graded tests, and tailored help for topics they need.
          </p>

          <ul className="space-y-3 text-sm text-white/90">
            <li>• Teachers: host live classes, upload lectures & tests</li>
            <li>• Students: practice, take tests, and get personalized help</li>
            <li>• Built-in analytics & progress tracking</li>
          </ul>

          <div className="mt-8">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md text-sm font-medium"
            >
              Explore Edaptix
            </button>
          </div>
        </section>

        {/* RIGHT: form */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center">
                <img src="/favicon.ico" alt="Edaptix" className="object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sign in to Edaptix</h2>
                <p className="text-sm text-slate-500">Welcome back — continue learning or teaching.</p>
              </div>
            </div>

            {/* Social signins */}
            {/* <div className="grid gap-3 mb-4">
              <button
                type="button"
                className="flex items-center justify-center gap-3 w-full rounded-md border px-3 py-2 hover:bg-slate-50"
                onClick={() => alert("Social login not wired yet")}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#4285F4" d="M24 9.5c3.6 0 6.7 1.2 8.9 2.8l6.6-6.6C35.8 2.9 30.2 1 24 1 14.9 1 6.9 5.9 2.7 13.6l7.6 5.9C12 13 17.6 9.5 24 9.5z"/>
                </svg>
                <span className="text-sm font-medium">Continue with Google</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-3 w-full rounded-md border px-3 py-2 hover:bg-slate-50"
                onClick={() => alert("Social login not wired yet")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z"/>
                </svg>
                <span className="text-sm font-medium">Continue with GitHub</span>
              </button>
            </div>

            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-slate-200" />
              <div className="text-sm text-slate-400">or</div>
              <div className="flex-1 h-px bg-slate-200" />
            </div> */}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email">Email</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="form_input"
                    autoComplete="email"
                  />
                  <Mail className="absolute right-3 top-3 text-slate-400" size={16} />
                </div>
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Your password"
                    className="form_input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-2 p-1 rounded"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Remember me
                </label>

                <a href="/forgot-password" className="text-sm text-teal">Forgot password?</a>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo text-white py-2 px-3 font-medium hover:bg-teal disabled:opacity-70 transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </div>
            </form>

            <p className="text-sm text-center text-slate-500 mt-4">
              Don't have an account?{" "}
              <a href="/signup" className="text-teal font-medium">
                Create one
              </a>
            </p>

            <p className="text-xs text-center text-slate-400 mt-3">
              By signing in you agree to our terms. We’ll never share your data without consent.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}