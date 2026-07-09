import type { RenderableServerComponent } from '@tanstack/react-start/rsc';
import type { JSX } from 'react/jsx-runtime';
import * as z from 'zod/v4';

import type { postFrontmatterSchema } from '#/modules/post/post.schema';

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export interface PostItem extends PostFrontmatter {
  slug: string;
  lastModification: string;
}

export interface PostContent extends PostItem {
  mdx: RenderableServerComponent<JSX.Element>;
}
