import { createFileRoute } from '@tanstack/react-router';

import { getPostBySlugFn } from '#/modules/post/post.fn';
import { ThumbnailFigure } from '#/modules/thumbnail/components/thumbnail-figure';
import { ArticleToc } from '#/modules/toc/components/article-toc';
import { Badge } from '#/ui/components/core/badge';
import { Separator } from '#/ui/components/core/separator';

export const Route = createFileRoute('/posts/$slug')({
  loader: ({ params: { slug } }) => getPostBySlugFn({ data: { slug } }),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <article>
        {post.thumbnail && <ThumbnailFigure thumbnail={post.thumbnail} className="mb-6" />}
        <header>
          <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>
          <p className="text-muted-foreground mb-2 text-sm">
            By {post.author} · <time dateTime={post.date}>{post.date}</time>
          </p>
          <p className="text-muted-foreground mb-3 text-sm">{post.description}</p>
          {post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="secondary">{tag}</Badge>
                </li>
              ))}
            </ul>
          )}
        </header>
        <Separator className="my-6" />
        <div className="prose dark:prose-invert">{post.mdx}</div>
      </article>
      <ArticleToc headings={post.toc} />
    </main>
  );
}
