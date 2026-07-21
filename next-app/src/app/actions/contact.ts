"use server";

import { z } from "zod";
import { Resend } from "resend";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { persistInquiry } from "@/lib/inquiries";
import { rateLimit } from "@/lib/rate-limit";

const INTEREST_LABELS: Record<string, string> = {
  "2-hand-holdem": "2 Hand Hold'em licensing",
  "badugi-chase": "Badugi Chase licensing",
  licensing: "General IP licensing",
  other: "Other",
};

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Enter a valid business email."),
  company: z.string().trim().min(2, "Please enter your company.").max(120),
  interest: z.enum(["2-hand-holdem", "badugi-chase", "licensing", "other"], {
    message: "Select an area of interest.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(2000, "Please keep it under 2000 characters."),
  // Honeypot: real users leave this empty.
  website: z.string().max(0, "Bot detected.").optional().or(z.literal("")),
});

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof z.infer<typeof inquirySchema>, string[]>>;
  values?: {
    name: string;
    email: string;
    company: string;
    interest: string;
    message: string;
  };
};

export async function submitInquiry(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const limit = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      status: "error",
      message: `Too many submissions. Please try again in about ${minutes} minute${
        minutes === 1 ? "" : "s"
      }.`,
    };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    interest: formData.get("interest"),
    message: formData.get("message"),
    website: formData.get("website"),
  };

  const parsed = inquirySchema.safeParse(raw);

  const values = {
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    company: typeof raw.company === "string" ? raw.company : "",
    interest: typeof raw.interest === "string" ? raw.interest : "",
    message: typeof raw.message === "string" ? raw.message : "",
  };

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  // Silently drop honeypot hits without revealing the reason.
  if (parsed.data.website) {
    return { status: "success", message: "Thanks — we'll be in touch shortly." };
  }

  const { name, email, company, interest, message } = parsed.data;
  const interestLabel = INTEREST_LABELS[interest] ?? interest;

  let emailDelivered = false;

  // Attempt email delivery first, but never let a failure lose the inquiry.
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL ?? "playbadugi@gmail.com";
    const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "Licensing <onboarding@resend.dev>";

    if (apiKey) {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        replyTo: email,
        subject: `B2B licensing inquiry — ${interestLabel} (${company})`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Company: ${company}`,
          `Interest: ${interestLabel}`,
          "",
          "Message:",
          message,
        ].join("\n"),
      });

      if (error) {
        console.error("[B2B inquiry] Resend error", error);
      } else {
        emailDelivered = true;
      }
    } else {
      console.info("[B2B inquiry] RESEND_API_KEY not set — relying on stored backup only");
    }
  } catch (err) {
    console.error("[B2B inquiry] Unexpected email error", err);
  }

  // Durable backup so the lead survives email/provider failures.
  const persisted = await persistInquiry({
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    name,
    email,
    company,
    interest: interestLabel,
    message,
    ip,
    emailDelivered,
  });

  // Only treat it as a failure if we couldn't email AND couldn't persist —
  // in that case the inquiry would truly be lost.
  if (!emailDelivered && !persisted) {
    return {
      status: "error",
      message: "Something went wrong sending your inquiry. Please try again.",
      values,
    };
  }

  return {
    status: "success",
    message: "Thanks — your licensing inquiry has been received. We'll be in touch shortly.",
  };
}
