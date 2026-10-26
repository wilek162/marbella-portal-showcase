import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ENQUIRY_DRAFT_TTL, browserDraftStorage, readEnquiryDraft, saveEnquiryDraft } from "./enquiry-draft-store";
import { largeSecureStore } from "./large-secure-store";

vi.mock("./large-secure-store", () => ({ largeSecureStore: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } }));
const now = 1_000_000;
const draft = { firstName: "Alex", lastName: "Smith", email: "alex@example.com", phone: "", message: "Arrange a viewing", propertyId: "MP123", property: {}, kind: "property" as const,
  requestId: "11111111-1111-4111-8111-111111111111", sourceUserId: "guest", verifiedUserId: null, expiresAt: now + ENQUIRY_DRAFT_TTL };
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(largeSecureStore.getItem).mockResolvedValue(JSON.stringify(draft));
  vi.mocked(largeSecureStore.setItem).mockResolvedValue();
  vi.mocked(largeSecureStore.removeItem).mockResolvedValue();
});

it("recovers an unsent guest draft with the original retry ID after restart", async () => {
  expect(await readEnquiryDraft({ id: "guest", is_anonymous: true }, now)).toEqual(draft);
});
it("recovers the local draft after ownership of its email was verified", async () => {
  expect(await readEnquiryDraft({ id: "owner", email: "ALEX@example.com", email_confirmed_at: "confirmed", is_anonymous: false }, now))
    .toEqual({ ...draft, verifiedUserId: "owner" });
});
it("does not expose the draft to another guest or an unverified email identity", async () => {
  expect(await readEnquiryDraft({ id: "other-guest", is_anonymous: true }, now)).toBeNull();
  expect(await readEnquiryDraft({ id: "other", email: draft.email, is_anonymous: false }, now)).toBeNull();
});
it("binds a verified draft to its account even if another account claims the same email", async () => {
  vi.mocked(largeSecureStore.getItem).mockResolvedValue(JSON.stringify({ ...draft, verifiedUserId: "owner" }));
  expect(await readEnquiryDraft({ id: "other", email: draft.email, email_confirmed_at: "confirmed" }, now)).toBeNull();
});
it.each(["malformed", JSON.stringify({ ...draft, expiresAt: now }), JSON.stringify({ ...draft, requestId: "invalid" })])("discards expired or damaged draft storage", async (raw) => {
  vi.mocked(largeSecureStore.getItem).mockResolvedValue(raw);
  expect(await readEnquiryDraft({ id: "guest" }, now)).toBeNull();
});
it("does not let a slow save resurrect a cancelled draft", async () => {
  let finish!: () => void;
  vi.mocked(largeSecureStore.setItem).mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
  const saving = saveEnquiryDraft(draft);
  const clearing = saveEnquiryDraft(null);
  await vi.waitFor(() => expect(largeSecureStore.setItem).toHaveBeenCalledTimes(1));
  expect(largeSecureStore.removeItem).not.toHaveBeenCalled();
  finish();
  await Promise.all([saving, clearing]);
  expect(largeSecureStore.removeItem).toHaveBeenCalledTimes(1);
});

it("restores a browser draft with its retry ID without using native storage", async () => {
  const values = new Map<string, string>();
  vi.stubGlobal("window", { sessionStorage: {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => values.set(name, value),
    removeItem: (name: string) => values.delete(name),
  } });
  await saveEnquiryDraft(draft, browserDraftStorage);
  expect(await readEnquiryDraft({ id: "guest" }, now, browserDraftStorage)).toEqual(draft);
  expect(largeSecureStore.setItem).not.toHaveBeenCalled();
  expect(await readEnquiryDraft({ id: "other" }, now, browserDraftStorage)).toBeNull();
  expect(values.size).toBe(0);
});

it("surfaces unavailable browser storage and can still clear a later draft", async () => {
  vi.stubGlobal("window", { get sessionStorage() { throw new Error("Storage denied"); } });
  await expect(saveEnquiryDraft(draft, browserDraftStorage)).rejects.toThrow("Storage denied");
  await expect(readEnquiryDraft({ id: "guest" }, now, browserDraftStorage)).rejects.toThrow("Storage denied");
  await saveEnquiryDraft(null);
  expect(largeSecureStore.removeItem).toHaveBeenCalledOnce();
});
