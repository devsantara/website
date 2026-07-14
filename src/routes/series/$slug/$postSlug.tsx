import { createFileRoute, Link } from '@tanstack/react-router';

import { getSeriesPostFn } from '#/modules/series/series.fn';
import { ThumbnailFigure } from '#/modules/thumbnail/components/thumbnail-figure';
import { PageTableOfContents } from '#/modules/toc/components/page-table-of-contents';
import { Badge } from '#/ui/components/core/badge';
import { Separator } from '#/ui/components/core/separator';

export const Route = createFileRoute('/series/$slug/$postSlug')({
  loader: ({ params: { slug, postSlug } }) => getSeriesPostFn({ data: { slug, postSlug } }),
  component: SeriesPostPage,
});

function SeriesPostPage() {
  const post = Route.useLoaderData();
  const { slug } = Route.useParams();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <article>
        <header>
          <Link
            to="/series/$slug"
            params={{ slug }}
            className="text-muted-foreground mb-4 inline-block text-sm underline"
          >
            ← Back to series
          </Link>
          {post.thumbnail && <ThumbnailFigure thumbnail={post.thumbnail} className="mb-6" />}
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
      <PageTableOfContents toc={post.toc} />
    </main>
  );
}
