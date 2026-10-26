import { z } from "zod";
import { largeSecureStore } from "./large-secure-store";

export const ENQUIRY_DRAFT_TTL = 24 * 60 * 60 * 1000;
const key = "marbella.pending-enquiry.v1";
const schema = z.object({
  firstName: z.string().max(50), lastName: z.string().max(50), email: z.string().email().max(320),
  phone: z.string().max(30), message: z.string().max(5000), propertyId: z.string().nullable(),
  property: z.object({ id: z.string().optional(), title: z.string().optional(), location: z.string().optional(), reference: z.string().optional(), price: z.string().optional(), imageUrl: z.string().optional() }),
  kind: z.enum(["property", "general"]), requestId: z.string().uuid(),
  sourceUserId: z.string().nullable(), verifiedUserId: z.string().nullable(), expiresAt: z.number().finite(),
});
export type StoredEnquiryDraft = z.infer<typeof schema>;
type DraftUser = { id: string; email?: string; is_anonymous?: boolean; email_confirmed_at?: string };

export function hasVerifiedDraftEmail(user: DraftUser | null, email: string): boolean {
  return Boolean(user && !user.is_anonymous && user.email_confirmed_at &&
    user.email?.toLowerCase() === email.toLowerCase());
}
let writing = Promise.resolve();

type DraftStorage = Pick<typeof largeSecureStore, "getItem" | "setItem" | "removeItem">;

// Tab-scoped browser storage deliberately does not fall back to localStorage.
// Access can throw in restricted browsers; callers surface that failure.
export const browserDraftStorage: DraftStorage = {
  getItem: async (name) => window.sessionStorage.getItem(name),
  setItem: async (name, value) => { window.sessionStorage.setItem(name, value); },
  removeItem: async (name) => { window.sessionStorage.removeItem(name); },
};

// Serialise writes so a late save cannot resurrect a cancelled or sent draft.
export function saveEnquiryDraft(draft: StoredEnquiryDraft | null, storage: DraftStorage = largeSecureStore): Promise<void> {
  writing = writing.catch(() => {}).then(() => draft
    ? storage.setItem(key, JSON.stringify(schema.parse(draft)))
    : storage.removeItem(key));
  return writing;
}

export async function readEnquiryDraft(user: DraftUser | null, now = Date.now(), storage: DraftStorage = largeSecureStore): Promise<StoredEnquiryDraft | null> {
  await writing.catch(() => {});
  const raw = await storage.getItem(key);
  if (!raw) return null;
  const discard = async () => { await storage.removeItem(key); return null; };
  if (!user) return discard();
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return discard(); }
  const parsed = schema.safeParse(value);
  if (!parsed.success || parsed.data.expiresAt <= now || parsed.data.expiresAt > now + ENQUIRY_DRAFT_TTL) return discard();
  const draft = parsed.data;
  if (draft.verifiedUserId) return draft.verifiedUserId === user.id ? draft : discard();
  // A local unsent draft may follow proven email ownership. This never moves
  // stored enquiries or any other account's server-side data.
  if (hasVerifiedDraftEmail(user, draft.email)) {
    return { ...draft, verifiedUserId: user.id };
  }
  return draft.sourceUserId === user.id ? draft : discard();
}
