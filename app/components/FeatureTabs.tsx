"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard/social", label: "Social Dashboard" },
  { href: "/banner", label: "Banner Builder" },
  { href: "/copy", label: "Copy Studio" },
];

export default function FeatureTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200 bg-white px-6">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-3">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-800 text-white"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-800"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
