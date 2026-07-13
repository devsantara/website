import * as z from 'zod/v4';

/**
 * A content thumbnail. `src` is a remote URL, or a path relative to the
 * document (`./cover.jpg`) that the build resolves to a fingerprinted asset.
 * `alt` is the image's alternative text (omit for a decorative image), and
 * `caption` is optional inline Markdown rendered beneath the image (e.g. an
 * image-credit link). Both `alt` and `caption` are optional, so authors may set
 * only `src`. The whole thumbnail is optional (`null`).
 */
export const thumbnailSchema = z
  .object({
    src: z.union([z.url(), z.string().regex(/^\.\.?\//)]),
    alt: z.string().optional(),
    caption: z.string().optional(),
  })
  .nullable();

/**
 * A thumbnail. As authored, `caption` is a raw inline-Markdown string; once
 * passed through `parseThumbnail` it holds the rendered HTML (or is
 * absent). `null` when the document has no thumbnail.
 */
export type Thumbnail = z.infer<typeof thumbnailSchema>;
