import { notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { renderServerComponent } from '@tanstack/react-start/rsc';
import { allPosts } from 'content-collections';
import * as z from 'zod/v4';

import { MarkdownRender } from '#/modules/markdown';
import type { PostContent, PostItem } from '#/modules/post/post.types';
import { parseThumbnail } from '#/modules/thumbnail/thumbnail.utils';

export const getAllPostsFn = createServerFn({ method: 'GET' }).handler((): PostItem[] => {
  return [...allPosts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((post) => {
      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        author: post.author,
        tags: post.tags,
        thumbnail: post.thumbnail,
        lastModification: post.lastModification,
      };
    });
});

export const getPostBySlugFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }): Promise<PostContent> => {
    const post = allPosts.find((post) => post.slug === data.slug);
    if (!post) throw notFound();

    return {
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      author: post.author,
      tags: post.tags,
      thumbnail: parseThumbnail(post.thumbnail),
      lastModification: post.lastModification,
      mdx: await renderServerComponent(<MarkdownRender content={post.mdx} />),
    };
  });
