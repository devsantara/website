import { createStart } from '@tanstack/react-start';

import { cacheRequestMiddleware } from '#/lib/cache/middleware';
import { CachePreset } from '#/lib/cache/presets';

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [cacheRequestMiddleware(CachePreset.standard())],
    functionMiddleware: [],
  };
});
