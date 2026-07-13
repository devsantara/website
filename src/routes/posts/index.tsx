import { createFileRoute, Link } from '@tanstack/react-router';

import { getAllPostsFn } from '#/modules/post/post.fn';

export const Route = createFileRoute('/posts/')({
  component: PostsPage,
  loader: () => getAllPostsFn(),
});

function PostsPage() {
  const posts = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-3xl font-bold">Posts</h1>
      <ul className="ml-4 flex list-decimal flex-col gap-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="group relative">
              <h2 className="font-semibold">
                <Link
                  to="/posts/$slug"
                  params={{ slug: post.slug }}
                  className="group-hover:underline after:absolute after:inset-0"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">{post.description}</p>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
