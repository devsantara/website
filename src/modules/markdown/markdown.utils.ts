import { execFile as syncExecFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { createDefaultImport } from '@content-collections/core';
import type { Nodes } from 'hast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';

import type { TableOfContents } from '#/modules/markdown/markdown.types';

const execFile = promisify(syncExecFile);

// Resolve the last-modified timestamp from git history instead of fs mtime,
// which is unreliable in CI (fresh checkouts stamp every file with clone time).
// Falls back to the current time for files with no commits yet (new/uncommitted
// posts). Memoized via `ctx.cache`, so it only re-runs when the document changes.
export async function getLastModification(filePath: string) {
  const { stdout } = await execFile('git', ['log', '-1', '--format=%aI', '--', filePath]);
  if (stdout) {
    return new Date(stdout.trim()).toISOString();
  }
  return new Date().toISOString();
}

/**
 * Resolves a content-relative asset reference to a build-time import, so any
 * frontmatter field that points at a local file (a thumbnail `src`, an OG image,
 * a gallery entry) is served as a fingerprinted, hashed asset URL.
 *
 * A remote or absolute `src` — anything not starting with `./` or `../` — passes
 * through untouched. A path relative to the document, `./cover.jpg` (the same
 * style MDX-body images use), becomes an import via `createDefaultImport`, which
 * content-collections rewrites into a real Vite import at build time; its
 * `ResolveImports` then collapses the marker back to the resolved URL string on
 * the collection type. Frontmatter is parsed as plain data and never reaches the
 * MDX image pipeline, so without this a relative path would ship verbatim and
 * 404 in the browser.
 *
 * `contentSubDir` is the referencing document's directory beneath `src/content`
 * (e.g. `series/markdown`), used to rebase the relative path onto the `#` alias.
 *
 * Build-only: this is the sole consumer of `@content-collections/core`, whose
 * bundle drags in gray-matter (direct `eval`) and esbuild. It lives here beside
 * the other content-collections build helpers — reached only from the config's
 * `transform`, which runs in Node — so those heavy transitive deps never pull
 * into the RSC/SSR Worker bundle via a runtime-reachable module.
 */
export function resolveAsset(src: string, contentSubDir: string) {
  if (!src.startsWith('.')) return src;
  const assetPath = path.posix.join(contentSubDir, src);
  return createDefaultImport<string>(`#/content/${assetPath}`);
}

/** Concatenates a hast subtree's text — the same content `rehype-slug` slugs. */
function textContent(node: Nodes): string {
  if (node.type === 'text') return node.value;
  if ('children' in node) return node.children.map(textContent).join('');
  return '';
}

/**
 * Builds a document's table of contents from its Markdown headings, as plain
 * data (`{ depth, title, id }`) rather than rendered nodes — so a page can
 * lay the entries out however it likes (`post.toc[0].title`,
 * `post.toc[0].id`), in a sidebar, inline, or nested list.
 *
 * `id` is the heading's slug: we run the very same `rehype-slug` the
 * render pipeline uses (see `markdown.vite.ts`) over the same headings, then read
 * the stamped `id` back off each one — so a `#id` link always lands on its
 * heading, duplicate titles and all, with no second slug implementation to drift.
 *
 * Takes the raw `.mdx` source (the caller reads it off disk — the
 * `frontmatter-only` Content Collections parser never exposes the body — and
 * memoizes this on that content). Build-only: it lives beside the other build
 * helpers so its Markdown-parsing dependencies stay out of the runtime bundle
 * (this module is reached only from the config's Node-side `transform`).
 */
export async function extractTableOfContents(content: string): Promise<TableOfContents> {
  // Content Collections strips the frontmatter through its own parser, but the
  // caller hands us the raw file, so drop the leading `---` … `---` block first —
  // otherwise its closing fence parses as a setext underline and turns the last
  // YAML line into a phantom heading.
  const body = content.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const tree = toHast(fromMarkdown(body)) as Nodes;
  // Stamp heading `id`s in place, exactly as the render pipeline does.
  rehypeSlug()(tree as never);

  const toc: TableOfContents = [];
  visit(tree, 'element', (node) => {
    const match = /^h([1-6])$/.exec(node.tagName);
    if (!match) return;
    const title = textContent(node).trim();
    const id = typeof node.properties.id === 'string' ? node.properties.id : '';
    if (!title || !id) return;
    toc.push({ depth: Number(match[1]), title, id });
  });
  return toc;
}
