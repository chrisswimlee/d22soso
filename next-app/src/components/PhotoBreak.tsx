type PhotoBreakProps = {
  src: string;
  alt: string;
  caption: string;
  kicker?: string;
  objectPosition?: string;
};

export default function PhotoBreak({
  src,
  alt,
  caption,
  kicker,
  objectPosition = "center",
}: PhotoBreakProps) {
  return (
    <figure className="relative w-full overflow-hidden">
      <div className="relative h-[42vh] min-h-[240px] max-h-[480px] w-full sm:h-[48vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          style={{ objectPosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          {kicker && (
            <p className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
              {kicker}
            </p>
          )}
          <figcaption className="mt-1 max-w-xl font-[family-name:var(--font-display)] text-2xl tracking-tight text-slate-50 sm:text-3xl">
            {caption}
          </figcaption>
        </div>
      </div>
    </figure>
  );
}
