import { createEnv } from '@t3-oss/env-core';
import * as z from 'zod/v4';

/** Env schema for client bundle */
export const clientEnv = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_BASE_URL: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
