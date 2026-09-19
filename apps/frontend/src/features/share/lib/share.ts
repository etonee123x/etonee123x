/** Opens the native share sheet and ignores deliberate cancellation. */
export const share = async (...parameters: Parameters<typeof globalThis.navigator.share>) => {
  try {
    await globalThis.navigator.share(...parameters);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }

    throw error;
  }
};
