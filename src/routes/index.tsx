import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="grid h-dvh place-content-center p-4">
      <h1 className="font-bold">@devsantara/website</h1>
    </main>
  );
}
