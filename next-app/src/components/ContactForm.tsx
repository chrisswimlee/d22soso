"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Send, Loader2 } from "lucide-react";
import { submitInquiry, type ContactFormState } from "@/app/actions/contact";

const initialState: ContactFormState = { status: "idle" };

const interests = [
  { value: "2-hand-holdem", label: "2 Hand Hold'em licensing" },
  { value: "badugi-chase", label: "Badugi Chase licensing" },
  { value: "licensing", label: "General IP licensing" },
  { value: "other", label: "Something else" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending…
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Send inquiry
        </>
      )}
    </button>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1.5 text-xs text-rose-400">{messages[0]}</p>;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/40";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-300";

export default function ContactForm() {
  const [state, formAction] = useActionState(submitInquiry, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <h3 className="text-xl font-semibold text-slate-50">Inquiry received</h3>
        <p className="max-w-md text-sm leading-relaxed text-slate-300">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.status === "error" && state.message && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            defaultValue={state.values?.name}
            className={inputClass}
            placeholder="Jane Doe"
          />
          <FieldError messages={state.errors?.name} />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Business email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            className={inputClass}
            placeholder="jane@company.com"
          />
          <FieldError messages={state.errors?.email} />
        </div>
      </div>

      <div>
        <label htmlFor="company" className={labelClass}>
          Company
        </label>
        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          defaultValue={state.values?.company}
          className={inputClass}
          placeholder="Casino / operator / studio"
        />
        <FieldError messages={state.errors?.company} />
      </div>

      <div>
        <label htmlFor="interest" className={labelClass}>
          Area of interest
        </label>
        <select
          id="interest"
          name="interest"
          defaultValue={state.values?.interest || ""}
          className={inputClass}
        >
          <option value="" disabled>
            Select an option…
          </option>
          {interests.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.interest} />
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Details
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          defaultValue={state.values?.message}
          className={`${inputClass} resize-y`}
          placeholder="Tell us about your venue, distribution, and timeline."
        />
        <FieldError messages={state.errors?.message} />
      </div>

      {/* Honeypot: hidden from users, catches bots. */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-center justify-end pt-1">
        <SubmitButton />
      </div>
    </form>
  );
}
