import Link from "next/link";

const features = [
  {
    title: "Social Dashboard",
    href: "/dashboard/social",
    description:
      "Track campaign sentiment, channel readiness, and audience signals in one command view.",
    eyebrow: "Insight",
  },
  {
    title: "Banner Builder",
    href: "/banner",
    description:
      "Draft offer-led creative for web and display placements with brand-safe guardrails.",
    eyebrow: "Creative",
  },
  {
    title: "Copy Studio",
    href: "/copy",
    description:
      "Generate concise launch copy for route promotions, loyalty moments, and traveler journeys.",
    eyebrow: "Messaging",
  },
];

export default function Home() {
  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#eff6ff_100%)]">
      <section className="mx-auto flex min-h-[calc(100dvh-65px)] max-w-7xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-800">
            Phase 2 Demo
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            A cockpit for Lufthansa marketing moments.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Move from social signals to ready-to-review campaign assets with a
            focused workspace for every launch channel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/social"
              className="rounded-full bg-blue-800 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-900"
            >
              Open Social Dashboard
            </Link>
            <Link
              href="/banner"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-950 transition hover:border-blue-200 hover:bg-blue-50"
            >
              Start a Banner
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group rounded-3xl border border-white/80 bg-white/85 p-6 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                {feature.eyebrow}
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {feature.title}
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                {feature.description}
              </p>
              <span className="mt-6 inline-flex font-semibold text-blue-800 transition group-hover:translate-x-1">
                Explore
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
