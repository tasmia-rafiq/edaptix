// /app/signin/page.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Chrome } from "lucide-react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [tab, setTab] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async (role: "student" | "teacher") => {
    setLoading(true);
    // After OAuth completes, NextAuth will redirect to the callbackUrl
    // which finalizes role at /auth/role?role=<role>
    await signIn("google", {
      callbackUrl: `/auth/role?role=${role}`,
    });
    setLoading(false);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-bg px-6 py-10">
      <div className="max-w-6xl w-full grid grid-cols-2 gap-8 items-stretch">
        {/* Left visual column */}
        <div className="rounded-2xl overflow-hidden hidden md:block shadow-lg">
          <Image
            src="/image1.jpg"
            alt="Sign In"
            width={1200}
            height={900}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right form column */}
        <div className="w-full bg-white rounded-2xl shadow-2xl p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center mb-6">
              <a href="/">
                <Image src="/logo.png" alt="Logo" width={180} height={44} />
              </a>
            </div>

            <h1 className="text-3xl font-semibold text-primary text-center">
              Welcome back
            </h1>
            <p className="text-center text-sm text-muted mb-6">
              Sign in to access your learning dashboard
            </p>

            {/* Tabs */}
            <div className="bg-gray-50 rounded-lg p-1 inline-flex gap-1 mx-auto mb-6">
              <button
                onClick={() => setTab("student")}
                className={`px-6 py-2 rounded-lg text-sm font-medium ${
                  tab === "student"
                    ? "bg-white shadow-sm text-primary"
                    : "text-muted"
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setTab("teacher")}
                className={`px-6 py-2 rounded-lg text-sm font-medium ${
                  tab === "teacher"
                    ? "bg-white shadow-sm text-primary"
                    : "text-muted"
                }`}
              >
                Teacher
              </button>
            </div>

            {/* Card */}
            <div className="space-y-4">
              <div className="p-4 border border-gray-100 rounded-lg">
                <p className="text-sm text-muted mb-3">
                  Signing in as{" "}
                  <span className="font-medium text-black-200">{tab}</span>.
                  Use your institutional or personal Google account.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleGoogle(tab)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-gray-200 hover:shadow-sm transition"
                  >
                    <Chrome className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Continue with Google</span>
                  </button>

                  {/* You can add other auth methods here (email/password) */}
                </div>

                <p className="text-xs text-muted mt-3">
                  By continuing you agree to our Terms of Service and Privacy
                  Policy.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom reasons */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-black-200 mb-2">
              Why sign in?
            </h4>
            <ul className="text-xs text-muted space-y-1">
              <li>• Track your progress and assessments</li>
              <li>• Personalized learning recommendations</li>
              <li>• Secure access to course content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
