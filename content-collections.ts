import { existsSync } from 'node:fs';
import path from 'node:path';

import type { WriterHook } from '@content-collections/core';
import { createDefaultImport, defineCollection, defineConfig } from '@content-collections/core';
import type { MDXContent } from 'mdx/types';

import { getLastModification, resolveAsset } from '#/modules/markdown/utils';
import { postFrontmatterSchema } from '#/modules/post/post.schema';
import {
  seriesFrontmatterSchema,
  seriesPostFrontmatterSchema,
} from '#/modules/series/series.schema';

const CONTENT_DIRECTORY = 'src/content';

const posts = defineCollection({
  name: 'posts',
  directory: `${CONTENT_DIRECTORY}/posts`,
  include: '*.mdx',
  parser: 'frontmatter-only',
  schema: postFrontmatterSchema,
  transform: async (document, ctx) => {
    const slug = document._meta.path;
    const filePath = document._meta.filePath;
    const lastModification = await ctx.cache(
      path.join(CONTENT_DIRECTORY, '/posts', filePath),
      getLastModification,
    );
    const mdx = createDefaultImport<MDXContent>(`#/content/posts/${filePath}`);
    const contentSubDir = path.posix.join('posts', path.posix.dirname(filePath));
    const thumbnail = document.thumbnail
      ? { ...document.thumbnail, src: resolveAsset(document.thumbnail.src, contentSubDir) }
      : null;
    return { ...document, slug, mdx, lastModification, thumbnail };
  },
});

const series = defineCollection({
  name: 'series',
  directory: `${CONTENT_DIRECTORY}/series`,
  include: '*/_index.mdx',
  parser: 'frontmatter-only',
  schema: seriesFrontmatterSchema,
  transform: async (document, ctx) => {
    const filePath = document._meta.filePath;
    const slug = document._meta.directory;
    const lastModification = await ctx.cache(
      path.join(CONTENT_DIRECTORY, '/series', filePath),
      getLastModification,
    );
    const mdx = createDefaultImport<MDXContent>(`#/content/series/${filePath}`);
    const contentSubDir = path.posix.join('series', path.posix.dirname(filePath));
    const thumbnail = document.thumbnail
      ? { ...document.thumbnail, src: resolveAsset(document.thumbnail.src, contentSubDir) }
      : null;
    return { ...document, slug, mdx, lastModification, thumbnail };
  },
});

const seriesPost = defineCollection({
  name: 'seriesPost',
  directory: `${CONTENT_DIRECTORY}/series`,
  include: ['*/*.mdx', '!*/_index.mdx'],
  parser: 'frontmatter-only',
  schema: seriesPostFrontmatterSchema,
  transform: async (document, ctx) => {
    const filePath = document._meta.filePath;
    const seriesSlug = document._meta.directory;
    const fileName = document._meta.fileName.replace(`.${document._meta.extension}`, '');
    const match = fileName.match(/^(\d+)_(.+)$/);
    if (!match) {
      throw new Error(
        `Series post "${filePath}" must be prefixed with an order number, e.g. "00_${fileName}.mdx".`,
      );
    }
    const [_, orderPrefix, slug] = match;
    const order = Number(orderPrefix);
    const lastModification = await ctx.cache(
      path.join(CONTENT_DIRECTORY, '/series', filePath),
      getLastModification,
    );
    const mdx = createDefaultImport<MDXContent>(`#/content/series/${filePath}`);
    const contentSubDir = path.posix.join('series', path.posix.dirname(filePath));
    const thumbnail = document.thumbnail
      ? { ...document.thumbnail, src: resolveAsset(document.thumbnail.src, contentSubDir) }
      : null;
    return { ...document, slug, seriesSlug, order, mdx, lastModification, thumbnail };
  },
  onSuccess: (documents) => {
    const ordersBySeries = new Map<string, Set<number>>();
    for (const document of documents) {
      const seen = ordersBySeries.get(document.seriesSlug) ?? new Set<number>();
      if (seen.has(document.order)) {
        throw new Error(
          `Series "${document.seriesSlug}" has two posts with order ${document.order}. Each post needs a unique numeric prefix.`,
        );
      }
      seen.add(document.order);
      ordersBySeries.set(document.seriesSlug, seen);
    }

    // Every series directory with posts must also ship an `_index.mdx`; without
    // it the series is absent from `allSeries`, so its detail page 404s while
    // the posts beneath it stay reachable — an easy-to-miss orphan state.
    for (const seriesSlug of ordersBySeries.keys()) {
      const indexPath = path.join(CONTENT_DIRECTORY, 'series', seriesSlug, '_index.mdx');
      if (!existsSync(indexPath)) {
        throw new Error(
          `Series "${seriesSlug}" has posts but no "_index.mdx". Add ${indexPath} so the series is listed and its detail page resolves.`,
        );
      }
    }
  },
});

// Keep the generated collection (and the compiled MDX it imports) out of the
// client bundle: prepend a `server-only` marker so TanStack Start's import
// protection fails the build if the collection is ever pulled client-side.
// See https://tanstack.com/start/latest/docs/framework/react/guide/import-protection
const serverOnlyHook: WriterHook = async ({ fileType, content }) => {
  if (fileType === 'typeDefinition') {
    return { content };
  }
  return {
    content: `import '@tanstack/react-start/server-only';\n\n${content}`,
  };
};

export default defineConfig({
  content: [posts, series, seriesPost],
  hooks: {
    writer: [serverOnlyHook],
  },
});
