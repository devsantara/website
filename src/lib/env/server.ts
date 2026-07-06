import { createEnv } from '@t3-oss/env-core';

/** Env schema for server bundle */
export const serverEnv = createEnv({
  server: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
