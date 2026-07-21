import { Handshake } from "lucide-react";
import ContactForm from "./ContactForm";

export default function ContactSection() {
  return (
    <section id="contact" className="relative mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 flex flex-col items-start gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-amber-300">
          <Handshake className="h-3.5 w-3.5" />
          B2B Licensing
        </span>
        <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
          License the games. Partner on what&apos;s next.
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          For operators, studios, and platforms interested in patented casino IP — send a note and
          we&apos;ll follow up.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <ContactForm />
      </div>
    </section>
  );
}
