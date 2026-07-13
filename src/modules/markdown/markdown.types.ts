/**
 * One entry in a document's table of contents, derived from a Markdown heading.
 * `depth` is the heading level (1–6), `title` the heading's plain text, and
 * `id` the slug `rehype-slug` stamps on the rendered heading — deep-link
 * to it with `#${id}`.
 *
 * It is plain data, not a rendered node, so a page renders it however it likes
 * (`post.toc[0].title`, `post.toc[0].id`).
 */
// A `type` (not an `interface`) so it keeps an implicit index signature and
// stays assignable to Content Collections' JSON-serializable document
// constraint — the value is derived in a collection `transform`.
export type TableOfContentsEntry = {
  depth: number;
  title: string;
  id: string;
};

/** A document's headings, in document order. */
export type TableOfContents = TableOfContentsEntry[];
