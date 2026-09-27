import { describe, expect, it } from 'vitest';
import { PostSlugGenerator } from './post-slug-generator';

const currentDate = new Date('2026-09-28T12:00:00.000Z');

const generateSlug = (text: string, existingSlugs: Array<string> = []) => {
  return new PostSlugGenerator().generate({ text, existingSlugs, currentDate });
};

describe('PostSlugGenerator', () => {
  it('transliterates plain text and keeps the first five words', () => {
    expect(generateSlug('Тестовый заголовок для персонального блога сегодня')).toBe(
      'testovyj-zagolovok-dlya-personalnogo-bloga',
    );
  });

  it('keeps hashtag words and excludes plain-text URLs', () => {
    expect(generateSlug('#Тег про блог https://example.com/page')).toBe('teg-pro-blog');
  });

  it('keeps words surrounded by literal angle brackets', () => {
    expect(generateSlug('<метка> обычный текст')).toBe('metka-obychnyj-tekst');
  });

  it('ignores emoji between words and keeps the surrounding words', () => {
    expect(generateSlug('🔥 котики 💩 и код 🧑‍💻')).toBe('kotiki-i-kod');
  });

  it('uses date slug when text contains only links or punctuation', () => {
    expect(generateSlug('https://example.com/page !!!')).toBe('post-2026-09-28');
  });

  it('uses date slug when text contains only emoji', () => {
    expect(generateSlug('🔥💩🧑‍💻')).toBe('post-2026-09-28');
  });

  it('keeps the slug within 60 characters without cutting a word', () => {
    const text = `${'a'.repeat(30)} ${'b'.repeat(29)} ${'c'.repeat(20)}`;
    const slug = generateSlug(text);

    expect(slug).toBe(`${'a'.repeat(30)}-${'b'.repeat(29)}`);
    expect(slug).toHaveLength(60);
  });

  it('truncates a single long word and reserves space for a collision suffix', () => {
    const longWord = 'a'.repeat(80);
    const baseSlug = 'a'.repeat(60);

    expect(generateSlug(longWord)).toBe(baseSlug);
    expect(generateSlug(longWord, [baseSlug])).toBe(`${'a'.repeat(58)}-2`);
  });

  it('appends the first available suffix to duplicate content slugs', () => {
    expect(generateSlug('Same words', ['same-words', 'same-words-2', 'same-words-4'])).toBe('same-words-3');
  });

  it('appends a suffix to duplicate date fallback slugs', () => {
    expect(generateSlug('', ['post-2026-09-28', 'post-2026-09-28-2'])).toBe('post-2026-09-28-3');
  });

  it('keeps collision suffixes within the maximum slug length', () => {
    const longWord = 'a'.repeat(120);
    const baseSlug = 'a'.repeat(60);
    const secondSlug = `${'a'.repeat(58)}-2`;
    const slug = generateSlug(longWord, [baseSlug, secondSlug]);

    expect(slug).toBe(`${'a'.repeat(58)}-3`);
    expect(slug).toHaveLength(60);
  });

  it('reserves the extra digit when collision suffix reaches ten', () => {
    const longWord = 'a'.repeat(120);
    const existingSlugs = [
      'a'.repeat(60),
      ...[2, 3, 4, 5, 6, 7, 8, 9].map((suffix) => {
        return `${'a'.repeat(58)}-${suffix}`;
      }),
    ];

    const slug = generateSlug(longWord, existingSlugs);

    expect(slug).toBe(`${'a'.repeat(57)}-10`);
    expect(slug).toHaveLength(60);
  });
});
