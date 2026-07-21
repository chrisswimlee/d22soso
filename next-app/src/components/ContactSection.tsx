import ContactForm from "./ContactForm";

export default function ContactSection() {
  return (
    <section id="contact" className="section-anchor relative mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-slate-50 sm:text-5xl">
          Request the Casino Licensing Deck
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-400 sm:text-lg">
          Operators and platforms interested in 2 Hand Hold&apos;em or Badugi Chase — send a note
          and we&apos;ll follow up. Prefer email?{" "}
          <a
            href="mailto:playbadugi@gmail.com?subject=Casino%20Licensing%20Deck%20Request"
            className="font-medium text-gold-soft hover:underline focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none"
          >
            playbadugi@gmail.com
          </a>
        </p>
      </div>

      <div className="rounded-2xl border border-gold/25 bg-white/[0.03] p-6 sm:p-8">
        <ContactForm />
      </div>
    </section>
  );
}
