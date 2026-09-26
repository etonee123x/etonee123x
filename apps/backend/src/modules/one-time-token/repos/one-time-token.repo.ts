export interface OneTimeTokenRepo {
  /**
   * Stores a token digest without exposing the original token to persistence.
   */
  create: (parameters: { tokenHash: string }) => Promise<void>;

  /**
   * Removes an unused token digest and returns its creation time.
   */
  consume: (parameters: { tokenHash: string }) => Promise<number | null>;

  /**
  Removes every stored token digest and returns the number of records removed.
  */
  clearAll: () => Promise<number>;
}
