import type { RenderableServerComponent } from '@tanstack/react-start/rsc';
import type { JSX } from 'react/jsx-runtime';
import * as z from 'zod/v4';

import type { TableOfContents } from '#/modules/markdown/markdown.types';
import type {
  seriesFrontmatterSchema,
  seriesPostFrontmatterSchema,
} from '#/modules/series/series.schema';

export type SeriesFrontmatter = z.infer<typeof seriesFrontmatterSchema>;
export type SeriesPostFrontmatter = z.infer<typeof seriesPostFrontmatterSchema>;

export interface SeriesItem extends SeriesFrontmatter {
  slug: string;
  lastModification: string;
}

export interface SeriesContent extends SeriesItem {
  posts: SeriesPostItem[];
  toc: TableOfContents;
  mdx: RenderableServerComponent<JSX.Element>;
}

export interface SeriesPostItem extends SeriesPostFrontmatter {
  slug: string;
  series: {
    slug: SeriesItem['slug'];
  };
  order: number;
  lastModification: string;
}

export interface SeriesPostContent extends SeriesPostItem {
  toc: TableOfContents;
  mdx: RenderableServerComponent<JSX.Element>;
}
