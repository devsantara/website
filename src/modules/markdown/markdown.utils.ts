import { execFile as syncExecFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { createDefaultImport } from '@content-collections/core';

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
