import path from 'node:path';

import type { WriterHook } from '@content-collections/core';
import { createDefaultImport, defineCollection, defineConfig } from '@content-collections/core';
import type { MDXContent } from 'mdx/types';

import { getLastModification } from '#/modules/markdown/utils';
import { postFrontmatterSchema } from '#/modules/post/post.schema';

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
    // The MDX body is compiled by the bundler (@mdx-js/rollup) via a static import.
    const mdx = createDefaultImport<MDXContent>(`#/content/posts/${filePath}`);
    return { ...document, slug, mdx, lastModification };
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
  content: [posts],
  hooks: {
    writer: [serverOnlyHook],
  },
});
