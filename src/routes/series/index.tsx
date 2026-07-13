import { createFileRoute, Link } from '@tanstack/react-router';

import { getAllSeriesFn } from '#/modules/series/series.fn';

export const Route = createFileRoute('/series/')({
  component: SeriesPage,
  loader: () => getAllSeriesFn(),
});

function SeriesPage() {
  const series = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-3xl font-bold">Series</h1>
      <ul className="flex flex-col gap-6">
        {series.map((item) => (
          <li key={item.slug}>
            <article className="group relative">
              <h2 className="font-semibold">
                <Link
                  to="/series/$slug"
                  params={{ slug: item.slug }}
                  className="group-hover:underline after:absolute after:inset-0"
                >
                  {item.title}
                </Link>
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
