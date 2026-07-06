import { useMediaQuery } from '#/ui/hooks/user-media-query';

export function useIsMobile() {
  return useMediaQuery('max-width', 'md', { initialValue: false });
}
