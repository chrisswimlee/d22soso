import { promises as fs } from "node:fs";
import path from "node:path";

export type InquiryRecord = {
  id: string;
  receivedAt: string;
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
  ip?: string;
  emailDelivered: boolean;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "inquiries.jsonl");

/**
 * Appends an inquiry to a local JSON Lines file so submissions persist
 * even if email delivery fails.
 *
 * Note: this uses the local filesystem, which is durable on a Node host
 * with a persistent disk. On ephemeral/serverless platforms (e.g. Vercel),
 * swap this for a database or object store — keep the same signature.
 */
export async function persistInquiry(record: InquiryRecord): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.appendFile(DATA_FILE, JSON.stringify(record) + "\n", "utf8");
    return true;
  } catch (err) {
    console.error("[inquiries] Failed to persist inquiry", err);
    return false;
  }
}
