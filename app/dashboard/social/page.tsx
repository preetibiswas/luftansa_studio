"use client";

import { FormEvent, useState } from "react";
import CopyButton from "../../components/CopyButton";
import LoadingSpinner from "../../components/LoadingSpinner";

type SocialPosts = {
  linkedin: string;
  instagram: string;
  facebook: string;
};

type Platform = keyof SocialPosts;

type SocialImages = Record<
  Platform,
  {
    prompt: string;
    dataUrl?: string;
    error?: string;
  }
>;

const platformCards: Array<{
  key: Platform;
  title: string;
  eyebrow: string;
}> = [
  {
    key: "linkedin",
    title: "LinkedIn",
    eyebrow: "Professional thought-starter",
  },
  {
    key: "instagram",
    title: "Instagram",
    eyebrow: "Visual caption",
  },
  {
    key: "facebook",
    title: "Facebook",
    eyebrow: "Community post",
  },
];

export default function SocialDashboardPage() {
  const [campaignIdea, setCampaignIdea] = useState("");
  const [posts, setPosts] = useState<SocialPosts | null>(null);
  const [images, setImages] = useState<SocialImages | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePosts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const idea = campaignIdea.trim();

    if (!idea) {
      setError("Enter a campaign idea to generate social posts.");
      setPosts(null);
      setImages(null);
      return;
    }

    setIsGenerating(true);
    setError("");
    setPosts(null);
    setImages(null);

    try {
      const response = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignIdea: idea }),
      });

      const data = (await response.json()) as {
        posts?: SocialPosts;
        images?: SocialImages;
        error?: string;
      };

      if (!response.ok || !data.posts) {
        throw new Error(data.error ?? "Unable to generate social posts.");
      }

      setPosts(data.posts);
      setImages(data.images ?? null);
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate social posts.";

      setError(message);
      setPosts(null);
      setImages(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-800">
            Social Post Generator
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Turn one campaign idea into three channel-ready posts
              </h1>
              <p className="mt-3 leading-7 text-slate-600">
                Enter a campaign thought and generate tailored copy plus
                platform-specific imagery for LinkedIn, Instagram, and Facebook
                in one pass.
              </p>
            </div>

            <form onSubmit={generatePosts} className="rounded-2xl bg-slate-50 p-5">
              <label
                htmlFor="campaign-idea"
                className="text-sm font-semibold text-slate-950"
              >
                Campaign idea
              </label>
              <textarea
                id="campaign-idea"
                value={campaignIdea}
                onChange={(event) => setCampaignIdea(event.target.value)}
                rows={5}
                placeholder="Example: Promote Lufthansa's new winter city-break fares across Europe."
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
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {platformCards.map((platform) => (
            <article
              key={platform.key}
              className="flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-800">
                {platform.eyebrow}
              </p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-950">
                  {platform.title}
                </h2>
                {posts?.[platform.key] ? (
                  <CopyButton text={posts[platform.key]} label="Copy post" />
                ) : null}
              </div>
              <div className="mt-5 flex flex-1 rounded-2xl bg-slate-50 p-5">
                {isGenerating ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm font-medium text-blue-800">
                    <LoadingSpinner className="size-6" />
                    Generating channel copy...
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                    {error}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {posts?.[platform.key] ??
                      "Your generated post will appear here after the campaign variants return."}
                  </p>
                )}
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {images?.[platform.key]?.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[platform.key].dataUrl}
                    alt={`${platform.title} campaign creative`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center px-5 text-center text-sm leading-6 text-slate-500">
                    {images?.[platform.key]?.error ? (
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
                        {images[platform.key].error}
                      </div>
                    ) : isGenerating ? (
                      <div className="flex flex-col items-center gap-3 font-medium text-blue-800">
                        <LoadingSpinner className="size-6" />
                        Generating platform image...
                      </div>
                    ) : (
                      "Your generated campaign image will appear here."
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
