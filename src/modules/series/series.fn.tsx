import { notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { renderServerComponent } from '@tanstack/react-start/rsc';
import { allSeries, allSeriesPosts } from 'content-collections';
import * as z from 'zod/v4';

import { MarkdownRender } from '#/modules/markdown';
import type {
  SeriesContent,
  SeriesItem,
  SeriesPostContent,
  SeriesPostItem,
} from '#/modules/series/series.types';
import { parseThumbnail } from '#/modules/thumbnail/thumbnail.utils';

export const getAllSeriesFn = createServerFn({ method: 'GET' }).handler((): SeriesItem[] => {
  return [...allSeries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((series) => {
      return {
        slug: series.slug,
        title: series.title,
        description: series.description,
        date: series.date,
        thumbnail: series.thumbnail,
        lastModification: series.lastModification,
      };
    });
});

export const getSeriesBySlugFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }): Promise<SeriesContent> => {
    const series = allSeries.find((series) => series.slug === data.slug);
    if (!series) throw notFound();

    const posts: SeriesPostItem[] = allSeriesPosts
      .filter((post) => post.seriesSlug === data.slug)
      .sort((a, b) => a.order - b.order)
      .map((post) => {
        return {
          slug: post.slug,
          order: post.order,
          title: post.title,
          description: post.description,
          date: post.date,
          author: post.author,
          tags: post.tags,
          // A post without its own thumbnail inherits the series' one.
          thumbnail: post.thumbnail ?? series.thumbnail,
          lastModification: post.lastModification,
          series: { slug: post.seriesSlug },
        };
      });

    return {
      slug: series.slug,
      title: series.title,
      description: series.description,
      date: series.date,
      thumbnail: parseThumbnail(series.thumbnail),
      lastModification: series.lastModification,
      posts,
      toc: series.toc,
      mdx: await renderServerComponent(<MarkdownRender content={series.mdx} />),
    };
  });

export const getSeriesPostFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string(), postSlug: z.string() }))
  .handler(async ({ data }): Promise<SeriesPostContent> => {
    const post = allSeriesPosts.find(
      (post) => post.seriesSlug === data.slug && post.slug === data.postSlug,
    );
    if (!post) throw notFound();

    // A post without its own thumbnail inherits the series' one.
    const series = allSeries.find((series) => series.slug === post.seriesSlug);

    return {
      slug: post.slug,
      order: post.order,
      title: post.title,
      description: post.description,
      date: post.date,
      author: post.author,
      tags: post.tags,
      thumbnail: parseThumbnail(post.thumbnail ?? series?.thumbnail ?? null),
      lastModification: post.lastModification,
      series: { slug: post.seriesSlug },
      toc: post.toc,
      mdx: await renderServerComponent(<MarkdownRender content={post.mdx} />),
    };
  });
