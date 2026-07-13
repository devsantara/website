import type { Thumbnail } from '#/modules/thumbnail/thumbnail.schema';
import { cn } from '#/ui/utils';

const IMAGE_CLASS = 'aspect-video w-full rounded-lg object-cover';

/**
 * Renders a detail-page thumbnail. With a caption it's a `figure` + the
 * `figcaption`, whose HTML `parseThumbnail` rendered from Markdown on the
 * server and this client component injects; without one it's a bare `img` — an
 * empty `figure` would be meaningless markup. Renders `null` for a missing
 * thumbnail. `className` styles the outer element, so outer spacing (the caller's
 * margin) lives with the layout rather than being baked in here. Caption links
 * are underlined here since this figure lives outside the `.prose` body.
 */
export function ThumbnailFigure({
  thumbnail,
  className,
}: {
  thumbnail: Thumbnail;
  className?: string;
}) {
  if (thumbnail == null) return null;

  if (!thumbnail.caption) {
    return (
      <img
        src={thumbnail.src}
        alt={thumbnail.alt ?? ''}
        decoding="async"
        className={cn(IMAGE_CLASS, className)}
      />
    );
  }

  return (
    <figure className={className}>
      <img src={thumbnail.src} alt={thumbnail.alt ?? ''} decoding="async" className={IMAGE_CLASS} />
      <figcaption
        className="prose dark:prose-invert text-muted-foreground mt-2 max-w-none text-center text-sm"
        // Server-rendered from the caption's inline Markdown (`parseThumbnail`);
        // author trust matches the MDX body, so injecting it adds no new exposure.
        dangerouslySetInnerHTML={{ __html: thumbnail.caption }}
      />
    </figure>
  );
}
