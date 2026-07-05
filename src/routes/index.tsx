import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="layout">
      <h1 className="title">@devsantara/website</h1>
    </main>
  );
}
