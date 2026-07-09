import * as z from 'zod/v4';

export const postFrontmatterSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.iso.date(),
  author: z.string(),
  tags: z.array(z.string()),
});
