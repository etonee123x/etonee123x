/**
 * Opens the native share sheet when available and falls back to copying the URL.
 * Deliberate cancellation is ignored so the UI can keep working normally.
 */
export const share = async (...parameters: Parameters<typeof globalThis.navigator.share>) => {
  const shareData = parameters[0];
  const url = shareData?.url;

  const fallbackToClipboard = async () => {
    if (!url) {
      throw new Error('Share URL is required');
    }

    await globalThis.navigator.clipboard.writeText(url);
  };

  if (typeof globalThis.navigator.share !== 'function') {
    await fallbackToClipboard();
    return;
  }

  try {
    await globalThis.navigator.share(...parameters);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }

    await fallbackToClipboard();
  }
};
