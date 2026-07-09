import { createFileRoute, Link } from '@tanstack/react-router';

import { getSeriesBySlugFn } from '#/modules/series/series.fn';
import { Separator } from '#/ui/components/core/separator';

export const Route = createFileRoute('/series/$slug/')({
  loader: ({ params: { slug } }) => getSeriesBySlugFn({ data: { slug } }),
  component: SeriesDetailPage,
});

function SeriesDetailPage() {
  const series = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <article>
        <header>
          <h1 className="mb-2 text-3xl font-bold">{series.title}</h1>
          <p className="text-muted-foreground mb-3 text-sm">{series.description}</p>
        </header>
        <Separator className="my-6" />
        <div className="prose dark:prose-invert">{series.mdx}</div>
      </article>
      <Separator className="my-6" />
      <section>
        <h2 className="mb-4 text-xl font-semibold">In this series</h2>
        {series.posts.length > 0 ? (
          <ol className="ml-4 flex list-decimal flex-col gap-4">
            {series.posts.map((post) => (
              <li key={post.slug}>
                <article className="group relative">
                  <h3 className="font-medium">
                    <Link
                      to="/series/$slug/$postSlug"
                      params={{ slug: series.slug, postSlug: post.slug }}
                      className="group-hover:underline after:absolute after:inset-0"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">{post.description}</p>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground text-sm">No posts in this series yet.</p>
        )}
      </section>
    </main>
  );
}
