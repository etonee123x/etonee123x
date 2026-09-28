const MAX_POST_DESCRIPTION_LENGTH = 140;

/** Keeps post descriptions concise without splitting words. */
export const getPostDescriptionContent = (text: string) => {
  const normalizedText = text.replaceAll(/\n+/g, ' ').replaceAll(/\s+/g, ' ').trim();

  if (!normalizedText) {
    return '';
  }

  if (normalizedText.length <= MAX_POST_DESCRIPTION_LENGTH) {
    return normalizedText;
  }

  const slicedText = normalizedText.slice(0, MAX_POST_DESCRIPTION_LENGTH);
  const lastSpaceIndex = slicedText.lastIndexOf(' ');

  return lastSpaceIndex === -1
    ? slicedText.slice(0, MAX_POST_DESCRIPTION_LENGTH - 1) + '…'
    : slicedText.slice(0, lastSpaceIndex) + '…';
};
