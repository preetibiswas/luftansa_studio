"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("mockAuthToken")) {
      router.replace("/dashboard/social");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = (await response.json()) as { token: string; email?: string };
      window.localStorage.setItem("mockAuthToken", data.token);
      window.localStorage.setItem("mockAuthEmail", data.email ?? email);
      window.dispatchEvent(new Event("mock-auth-change"));
      router.replace("/dashboard/social");
    } catch {
      setError("Unable to reach the mock auth backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-slate-100 px-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-5 rounded-3xl bg-white p-8 shadow-sm"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-700">
            Lufthansa POC
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-950">
            Enter with any email
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Phase 1 uses mock authentication only. No password is required.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          Email
          <input
            type="text"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="traveler@example.com"
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? "Entering..." : "Enter"}
        </button>
      </form>
    </main>
  );
}
