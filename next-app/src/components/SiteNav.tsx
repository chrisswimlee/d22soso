"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#twohh", id: "twohh", label: "2HH" },
  { href: "#timeline", id: "timeline", label: "Story" },
  { href: "#apm", id: "apm", label: "APM" },
  { href: "#media", id: "media", label: "Media" },
  { href: "#contact", id: "contact", label: "Contact" },
];

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .6 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.3.6 9.3.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
    </svg>
  );
}

function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a
        href="https://www.instagram.com/D22_soso/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="text-slate-400 transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
      >
        <IconInstagram className="h-4 w-4" />
      </a>
      <a
        href="https://x.com/D22_soso"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X / Twitter"
        className="text-slate-400 transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.717-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a
        href="https://www.youtube.com/@WayneChiangPoker"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="YouTube"
        className="text-slate-400 transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
      >
        <IconYoutube className="h-4 w-4" />
      </a>
    </div>
  );
}

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("top");

  useEffect(() => {
    const ids = ["top", ...links.map((l) => l.id)];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/10 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a
          href="#top"
          className="font-[family-name:var(--font-display)] text-lg tracking-wide text-gold sm:text-xl focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
        >
          D22-soso
        </a>

        <nav className="hidden items-center gap-1 text-sm text-slate-400 md:flex">
          {links.map((link) => {
            const isActive = active === link.id;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none ${
                  isActive ? "text-gold-soft" : "hover:text-slate-200"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-gold" />
                )}
              </a>
            );
          })}
          <SocialLinks className="ml-3 border-l border-white/10 pl-5" />
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 text-slate-300 focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none md:hidden"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="flex w-5 flex-col gap-1">
            <span className={`h-0.5 w-full bg-current transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`h-0.5 w-full bg-current transition ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-full bg-current transition ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/5 px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block min-h-11 rounded-lg px-3 py-3 text-sm transition-colors ${
                    active === link.id
                      ? "bg-gold/10 text-gold-soft"
                      : "text-slate-300 hover:bg-white/5 hover:text-gold"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <SocialLinks className="mt-3 border-t border-white/5 pt-3" />
        </nav>
      )}
    </header>
  );
}
