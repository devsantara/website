import handler from '@tanstack/react-start/server-entry';

import { paraglideMiddleware } from '#/lib/i18n/paraglide/server';

export default {
  fetch(req: Request): Promise<Response> {
    return paraglideMiddleware(req, () => handler.fetch(req));
  },
};
