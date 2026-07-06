import { createTranslatedPathnames, createTranslatedPrerender } from '#/lib/i18n/utils';

export const translatedPathnames = createTranslatedPathnames({
  '/': { en: '/', id: '/' },
});

export const translatedPrerender = createTranslatedPrerender(
  { en: ['/'], id: ['/'] },
  { crawlLinks: false },
);
