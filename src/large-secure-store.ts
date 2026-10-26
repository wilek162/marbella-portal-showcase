// Showcase-only adapter: the private native app uses Expo SecureStore.
// This deliberately throws rather than storing contact details insecurely.
// Tests mock this boundary; browser callers pass browserDraftStorage explicitly.
export const largeSecureStore = {
  async getItem(_key: string): Promise<string | null> { throw new Error("Native storage is not included in this standalone sample"); },
  async setItem(_key: string, _value: string): Promise<void> { throw new Error("Native storage is not included in this standalone sample"); },
  async removeItem(_key: string): Promise<void> { throw new Error("Native storage is not included in this standalone sample"); },
};
