"use client";

import { Play } from "lucide-react";
import { useState } from "react";

type YouTubeEmbedProps = {
  videoId: string;
  title: string;
  /** Optional caption shown beneath the player. */
  caption?: string;
};

/**
 * Responsive 16:9 YouTube embed using a click-to-load facade:
 * the thumbnail loads instantly and the heavy iframe is only
 * mounted after interaction, keeping the page fast.
 */
export default function YouTubeEmbed({ videoId, title, caption }: YouTubeEmbedProps) {
  const [active, setActive] = useState(false);

  return (
    <figure className="w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        {active ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="group absolute inset-0 h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label={`Play video: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" />
            </span>
            <span className="absolute bottom-4 left-4 right-4 text-left text-sm font-medium text-slate-100 sm:text-base">
              {title}
            </span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-sm text-slate-400">{caption}</figcaption>
      )}
    </figure>
  );
}
