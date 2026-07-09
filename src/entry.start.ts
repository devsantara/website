import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

import { cacheRequestMiddleware } from '#/lib/cache/middleware';
import { CachePreset } from '#/lib/cache/presets';

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [cacheRequestMiddleware(CachePreset.standard()), csrfMiddleware],
    functionMiddleware: [],
  };
});
