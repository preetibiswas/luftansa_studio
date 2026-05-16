"use client";

import { FormEvent, useState } from "react";
import CopyButton from "../components/CopyButton";
import FeatureTabs from "../components/FeatureTabs";
import LoadingSpinner from "../components/LoadingSpinner";

type Platform = "linkedin" | "instagram" | "facebook";

const platforms: Array<{
  value: Platform;
  label: string;
  tone: string;
}> = [
  {
    value: "linkedin",
    label: "LinkedIn",
    tone: "Professional, credible, and business-friendly",
  },
  {
    value: "instagram",
    label: "Instagram",
    tone: "Visual, warm, and aspirational",
  },
  {
    value: "facebook",
    label: "Facebook",
    tone: "Friendly, accessible, and community-led",
  },
];

const actions = [
  "Drive bookings",
  "Build awareness",
  "Promote an offer",
  "Invite engagement",
  "Announce a launch",
  "Celebrate a milestone",
  "Tell a brand story",
  "Inspire trip planning",
  "Promote loyalty sign-ups",
  "Highlight premium experience",
  "Encourage newsletter sign-ups",
  "Invite user-generated stories",
  "Re-engage past travelers",
  "Promote a seasonal campaign",
  "Drive app downloads",
];

export default function CopyPage() {
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [goal, setGoal] = useState("");
  const [action, setAction] = useState(actions[0]);
  const [copy, setCopy] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedPlatform = platforms.find((item) => item.value === platform);

  const generateCopy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedGoal = goal.trim();

    if (!trimmedGoal) {
      setError("Enter a goal to generate persuasive copy.");
      setCopy("");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCopy("");

    try {
      const response = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, goal: trimmedGoal, action }),
      });

      const data = (await response.json()) as {
        copy?: string;
        error?: string;
      };

      if (!response.ok || !data.copy) {
        throw new Error(data.error ?? "Unable to generate copy.");
      }

      setCopy(data.copy);
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate copy.";

      setError(message);
      setCopy("");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <FeatureTabs />
      <main className="flex flex-1 px-6 py-10">
        <section className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-800">
            Copy Studio
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Generate persuasive copy for each social channel
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Choose a platform, describe the campaign goal, and pick the
                action you want travelers to take. Gemini will tailor the copy to
                the selected channel tone.
              </p>

              <form onSubmit={generateCopy} className="mt-8 rounded-2xl bg-slate-50 p-5">
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-950">
                    Platform
                  </legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {platforms.map((item) => {
                      const isSelected = platform === item.value;

                      return (
                        <label
                          key={item.value}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            isSelected
                              ? "border-blue-800 bg-blue-50 ring-4 ring-blue-100"
                              : "border-slate-200 bg-white hover:border-blue-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="platform"
                            value={item.value}
                            checked={isSelected}
                            onChange={() => setPlatform(item.value)}
                            className="sr-only"
                          />
                          <span className="block text-sm font-semibold text-slate-950">
                            {item.label}
                          </span>
                          <span className="mt-2 block text-xs leading-5 text-slate-500">
                            {item.tone}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <label
                  htmlFor="copy-goal"
                  className="mt-5 block text-sm font-semibold text-slate-950"
                >
                  Goal
                </label>
                <textarea
                  id="copy-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  rows={5}
                  placeholder="Example: Encourage premium leisure travelers to book a summer escape to Rome with Lufthansa."
                  className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />

                <label
                  htmlFor="copy-action"
                  className="mt-5 block text-sm font-semibold text-slate-950"
                >
                  Action
                </label>
                <select
                  id="copy-action"
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                >
                  {actions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                {error ? (
                  <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>
              </form>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="rounded-2xl bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
                    {selectedPlatform?.label ?? "Selected Platform"}
                  </p>
                  {copy ? <CopyButton text={copy} label="Copy copy" /> : null}
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                  Generated Copy
                </h2>
                <div className="mt-5 min-h-80 rounded-2xl bg-slate-50 p-5">
                  {isGenerating ? (
                    <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 text-center text-sm font-medium text-blue-800">
                      <LoadingSpinner className="size-6" />
                      Generating tailored copy...
                    </div>
                  ) : error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                      {error}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {copy || "Your persuasive platform copy will appear here."}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
