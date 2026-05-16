"use client";

import { FormEvent, useState } from "react";
import CopyButton from "../components/CopyButton";
import FeatureTabs from "../components/FeatureTabs";
import LoadingSpinner from "../components/LoadingSpinner";

export default function BannerPage() {
  const [campaignText, setCampaignText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = campaignText.trim();

    if (!text) {
      setError("Enter campaign text to generate a banner.");
      setImageUrl("");
      setPrompt("");
      return;
    }

    setIsGenerating(true);
    setError("");
    setImageUrl("");
    setPrompt("");

    try {
      const response = await fetch("/api/generate-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignText: text }),
      });

      const data = (await response.json()) as {
        imageUrl?: string;
        prompt?: string;
        error?: string;
      };

      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error ?? "Unable to generate banner.");
      }

      setImageUrl(data.imageUrl);
      setPrompt(data.prompt ?? "");
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate banner.";

      setError(message);
      setImageUrl("");
      setPrompt("");
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
            Banner Builder
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Turn campaign text into a ready-to-review banner
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Enter a route promotion, seasonal idea, or loyalty message and
                generate a clean marketing banner for display placements.
              </p>

              <form onSubmit={generateBanner} className="mt-8 rounded-2xl bg-slate-50 p-5">
                <label
                  htmlFor="campaign-text"
                  className="text-sm font-semibold text-slate-950"
                >
                  Campaign text
                </label>
                <textarea
                  id="campaign-text"
                  value={campaignText}
                  onChange={(event) => setCampaignText(event.target.value)}
                  rows={5}
                  placeholder="Example: Fly Lufthansa to Munich this winter with limited-time fares."
                  className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />
                {error ? (
                  <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
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

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="Generated campaign banner"
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center px-6 text-center text-sm leading-6 text-slate-500">
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-3 font-medium text-blue-800">
                        <LoadingSpinner className="size-6" />
                        Generating banner image...
                      </div>
                    ) : error ? (
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
                        {error}
                      </div>
                    ) : (
                      "Your generated banner will appear here."
                    )}
                  </div>
                )}
              </div>
              {prompt ? (
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
                      Image Prompt
                    </p>
                    <CopyButton text={prompt} label="Copy prompt" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{prompt}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
