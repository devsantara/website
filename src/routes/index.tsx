import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="grid h-dvh place-content-center gap-2 p-4 text-center">
      <h1 className="font-bold">@devsantara/website</h1>
      <Link to="/posts" className="text-muted-foreground text-sm underline">
        Read the posts
      </Link>
    </main>
  );
}
