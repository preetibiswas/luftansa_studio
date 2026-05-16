"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard/social", label: "Social" },
  { href: "/banner", label: "Banner" },
  { href: "/copy", label: "Copy" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const syncAuthState = () => {
      setEmail(window.localStorage.getItem("mockAuthEmail"));
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("mock-auth-change", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("mock-auth-change", syncAuthState);
    };
  }, [pathname]);

  const signOut = () => {
    window.localStorage.removeItem("mockAuthToken");
    window.localStorage.removeItem("mockAuthEmail");
    window.dispatchEvent(new Event("mock-auth-change"));
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-6 py-3 text-sm text-slate-700 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-blue-800 text-sm font-bold text-white">
            LH
          </span>
          <span className="font-semibold tracking-tight text-slate-950">
            Lufthansa Studio
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {email ? (
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-slate-600 sm:block">
              {email}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-blue-800 px-4 py-2 font-semibold text-white transition hover:bg-blue-900"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
