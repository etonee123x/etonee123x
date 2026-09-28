import slugify from 'slugify';

const MAX_POST_SLUG_WORDS = 5;
const MAX_POST_SLUG_LENGTH = 60;

export class PostSlugGenerator {
  private fitSlugToLength(slug: string, maxLength: number): string {
    if (slug.length <= maxLength) {
      return slug;
    }

    let fittedSlug = '';
    for (const word of slug.split('-')) {
      const nextSlug = fittedSlug ? `${fittedSlug}-${word}` : word;
      if (nextSlug.length > maxLength) {
        return fittedSlug || word.slice(0, maxLength);
      }

      fittedSlug = nextSlug;
    }

    return fittedSlug;
  }

  private createSuffixedSlug(slug: string, suffix: number): string {
    const suffixText = `-${suffix}`;
    const slugBase = this.fitSlugToLength(slug, MAX_POST_SLUG_LENGTH - suffixText.length);
    return `${slugBase}${suffixText}`;
  }

  /**
  Generates a short content-based slug, with date fallback and collision suffixes.
  */
  generate(parameters: { text: string; existingSlugs: Iterable<string>; currentDate: Date }): string {
    const words = slugify(parameters.text.replaceAll(/(?:https?:\/\/|www\.)\S+/gi, ' ').replaceAll(/[<>]/g, ' '), {
      lower: true,
      strict: true,
    })
      .split('-')
      .filter(Boolean);
    const slugWords: Array<string> = [];

    for (const word of words) {
      if (slugWords.length >= MAX_POST_SLUG_WORDS) {
        break;
      }

      const nextSlug = [...slugWords, word].join('-');
      if (nextSlug.length > MAX_POST_SLUG_LENGTH) {
        if (slugWords.length === 0) {
          slugWords.push(word.slice(0, MAX_POST_SLUG_LENGTH));
        }

        break;
      }

      slugWords.push(word);
    }

    const dateSlug = `post-${parameters.currentDate.toISOString().slice(0, 10)}`;
    const baseSlug = slugWords.join('-') || dateSlug;
    const existingSlugSet = new Set(parameters.existingSlugs);

    if (!existingSlugSet.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    let uniqueSlug = this.createSuffixedSlug(baseSlug, suffix);
    while (existingSlugSet.has(uniqueSlug)) {
      suffix += 1;
      uniqueSlug = this.createSuffixedSlug(baseSlug, suffix);
    }

    return uniqueSlug;
  }
}
