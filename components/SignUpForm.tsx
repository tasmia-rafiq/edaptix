// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function SignUpForm() {
//   const router = useRouter();
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);


//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);
//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name, email, password }),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         setError(data?.error || "Signup failed");
//       } else {
//         // success — session cookie is set by server; redirect to dashboard or home
//         router.push("/dashboard");
//       }
//     } catch (err) {
//       console.error(err);
//       setError("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
//       <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
//         <h1 className="text-2xl font-semibold mb-6 text-center">
//           Create your Edaptix account
//         </h1>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium mb-1">Name</label>
//             <input
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//               className="form_input"
//               placeholder="Your name"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Email</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               className="form_input"
//               placeholder="you@example.com"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               minLength={6}
//               className="form_input"
//               placeholder="Choose a strong password"
//             />
//           </div>

//           {error && <p className="text-sm text-red-600">{error}</p>}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60"
//           >
//             {loading ? "Creating account..." : "Sign up"}
//           </button>
//         </form>

//         <p className="text-sm text-center text-slate-500 mt-4">
//           Already have an account?{" "}
//           <a href="/signin" className="text-sky-600">
//             Sign in
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState, useMemo, JSX } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User2, Mail, Loader2, Zap } from "lucide-react";

type Role = "student" | "teacher";


function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export default function SignUpForm(): JSX.Element {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");

  // teacher fields
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");

  // student fields
  const [interests, setInterests] = useState("");

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);
  const strengthLabel = ["Very weak", "Weak", "Okay", "Good", "Strong"][score] ?? "Very weak";
  const strengthPct = (score / 4) * 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill all required fields.");
      return;
    }

    // enforce > 6 characters (at least 7)
    if (password.length <= 6) {
      setError("Password must be at least 7 characters.");
      return;
    }

    if (!acceptTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // teacher-specific validation
    if (role === "teacher") {
      if (!expertise.trim()) {
        setError("Please add at least one expertise/subject you teach.");
        return;
      }
      if (bio.trim().length < 20) {
        setError("Please provide a short bio (at least 20 characters).");
        return;
      }
    }

    setLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      };

      if (role === "teacher") {
        payload.expertise = expertise.trim();
        payload.bio = bio.trim();
      } else {
        payload.interests = interests.trim();
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Signup failed. Try again.");
        setLoading(false);
        return;
      }

      // success — server should set HttpOnly session cookie
      // navigate to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const passwordTooShort = password.length > 0 && password.length <= 6;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 items-start gap-4">
        {/* LEFT: hero */}
        <section className="hidden lg:flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-tr from-teal to-indigo text-white shadow-lg">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
              <Zap size={18} />
              <span>Launch teaching — empower learners</span>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Teach live, create courses, and help students grow.
          </h1>
          <p className="text-sky-100/90 mb-6">
            Edaptix connects teachers and students: teachers upload lessons, tests and assessments; students
            watch lessons, take tests, and receive AI-assisted grading and personalized learning help.
          </p>

          <ul className="space-y-3 text-sm text-white/90">
            <li>• Teachers: upload lectures, design tests & manage assessments</li>
            <li>• Students: take courses, get AI-graded tests & personalized help</li>
            <li>• Built-in tools for progress tracking, analytics, and feedback</li>
          </ul>

          <div className="mt-8">
            <button
              onClick={() => router.push("/about")}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md text-sm font-medium"
            >
              Learn how Edaptix works
            </button>
          </div>
        </section>

        {/* RIGHT: form */}
        <section className="flex items-center justify-center">
          <div className="w-full bg-white rounded-2xl shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center">
                <img src="/favicon.ico" alt="Edaptix" className="object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Create your Edaptix account</h2>
                <p className="text-sm text-slate-500">
                  Join as a teacher or student — create courses, assessments, and start learning.
                </p>
              </div>
            </div>

            {/* Role toggle */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2">I am a</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex-1 py-2 rounded-md border border-slate-400 ${
                    role === "student" ? "bg-teal text-white border-teal" : "bg-white text-slate-600"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex-1 py-2 rounded-md border border-slate-400 ${
                    role === "teacher" ? "bg-teal text-white border-teal" : "bg-white text-slate-600"
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>

            {/* Social signups */}
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

            <form onSubmit={handleSubmit} className="space-y-4 signup-form" noValidate>
              <div>
                <label htmlFor="name">
                  Full name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="form_input"
                  />
                  <User2 className="absolute right-3 top-3 text-slate-400" size={16} />
                </div>
              </div>

              <div>
                <label htmlFor="email">
                  Email
                </label>
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
                <label htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create a strong password"
                    minLength={7}
                    aria-invalid={passwordTooShort}
                    className="form_input pr-10"
                    autoComplete="new-password"
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

                {/* live helper */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className={passwordTooShort ? "text-red-600" : "text-slate-400"}>
                    {passwordTooShort ? "Password must be at least 7 characters." : "Use 7+ characters for better security."}
                  </div>
                  <div className="text-slate-400">{password.length} chars</div>
                </div>

                {/* strength bar */}
                <div className="mt-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${strengthPct}%`,
                        background:
                          score >= 3
                            ? "linear-gradient(90deg,#10b981,#06b6d4)"
                            : "linear-gradient(90deg,#f97316,#f43f5e)",
                      }}
                      aria-hidden
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{strengthLabel}</span>
                    <span>{password.length} chars</span>
                  </div>
                </div>
              </div>

              {/* Role-specific fields */}
              {role === "teacher" ? (
                <>
                  <div>
                    <label htmlFor="expertise">
                      Expertise / Subjects (comma separated)
                    </label>
                    <input
                      id="expertise"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="e.g. Physics, Calculus, Data Structures"
                      className="form_input"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Help students find you — add subjects you teach.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bio">
                      Short bio
                    </label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Briefly introduce yourself (teaching experience, credentials, what you teach)"
                      rows={3}
                      className="form_input"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      This appears on your teacher profile and helps students choose you.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="interests">
                      Subjects / Topics you're interested in
                    </label>
                    <input
                      id="interests"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder="e.g. Algebra, Web Development, Python"
                      className="form_input"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      We’ll suggest relevant courses and teachers based on this.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="terms" className="text-sm text-slate-600">
                  I agree to Edaptix{" "}
                  <a className="text-teal underline" href="/terms" target="_blank" rel="noreferrer">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a className="text-teal underline" href="/privacy" target="_blank" rel="noreferrer">
                    Privacy Policy
                  </a>
                  .
                </label>
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
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Sign up</span>
                  )}
                </button>
              </div>
            </form>

            <p className="text-sm text-center text-slate-500 mt-4">
              Already have an account?{" "}
              <a href="/signin" className="text-teal font-medium">
                Sign in
              </a>
            </p>

            <p className="text-xs text-center text-slate-400 mt-3">
              By signing up you agree to our terms. We’ll never share your data without consent.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}