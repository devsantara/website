import os from 'node:os';

import alchemy, { type Scope } from 'alchemy';
import { TanStackStart } from 'alchemy/cloudflare';
import { GitHubComment } from 'alchemy/github';
import { CloudflareStateStore } from 'alchemy/state';
import { parse as parseURL } from 'tldts';

import { alchemyEnv } from '#/lib/env/alchemy.ts';

const HOST_USER = os.userInfo().username;
const ALCHEMY_STATE_TOKEN = alchemy.secret(alchemyEnv.ALCHEMY_STATE_TOKEN);

/**
 * Resolves the deployment stage from the alchemy scope.
 *
 * Stage is derived from the scope's stage string, which follows the format:
 * `<stage>[-<name>]` (e.g. `production`, `staging-v2`, `preview-feat-x`, or `<host-user>`).
 *
 * @param scope - The alchemy scope provided at runtime.
 * @returns An object containing the resolved `stage`, optional `name`, and `isDevMode` flag.
 * @throws {Error} If the stage prefix does not match any known stage or the current host user.
 */
function getStage(scope: Scope) {
  const isDevMode = scope.local;

  // Match the local stage against the full stage string first — the username
  // may itself contain hyphens, which the split below would otherwise truncate.
  if (scope.stage === HOST_USER) {
    return { id: 'local', name: HOST_USER, isDevMode } as const;
  }

  const [stage, ...nameParts] = scope.stage.split('-');
  const name = nameParts.join('-') || null;

  if (stage === 'production') {
    return { id: 'production', name, isDevMode } as const;
  }
  if (stage === 'staging') {
    return { id: 'staging', name, isDevMode } as const;
  }
  if (stage === 'preview') {
    return { id: 'preview', name, isDevMode } as const;
  }
  throw new Error(`Unknown stage: ${scope.stage}`);
}
type Stage = ReturnType<typeof getStage>;

/**
 * Resolves the custom domains for the deployment based on stage and hostname config.
 *
 * In dev mode, returns `undefined` so no custom domain is attached (the worker is
 * served locally by `alchemy dev`; the workers.dev URL is disabled via `url: false`).
 * For production, uses the bare hostname from `HOSTNAME`. For other stages, constructs
 * a subdomain by combining the stage (and optional name) with the base domain.
 *
 * @param stage - The resolved stage object from {@link getStage}.
 * @returns An array of domain strings, or `undefined` for local dev.
 */
function getDomains({ id: stage, name, isDevMode }: Stage) {
  if (isDevMode) return undefined;

  const { hostname, subdomain, domain } = parseURL(alchemyEnv.HOSTNAME);
  const hasSubdomain = subdomain !== null && subdomain !== '';

  if (stage === 'production') {
    return [hostname ?? alchemyEnv.HOSTNAME];
  }

  if (hasSubdomain) {
    if (name !== null) {
      return [`${subdomain}--${stage}-${name}.${domain}`];
    } else {
      return [`${subdomain}--${stage}.${domain}`];
    }
  } else {
    if (name !== null) {
      return [`${stage}-${name}.${domain}`];
    } else {
      return [`${stage}.${domain}`];
    }
  }
}

/**
 * Returns the Cloudflare Workers observability config for the given stage.
 *
 * Enabled for all non-local, non-dev deployments (production, staging, preview).
 *
 * @param stage - The resolved stage object from {@link getStage}.
 * @returns An object with an `enabled` boolean for Cloudflare observability.
 */
function getObservability({ id: stage, isDevMode }: Stage) {
  if (isDevMode) return { enabled: false };
  switch (stage) {
    case 'production':
    case 'staging':
    case 'preview':
      return { enabled: true };
    case 'local':
      return { enabled: false };
  }
}

/**
 * Returns the Cloudflare Workers placement config for the given stage.
 *
 * Smart placement is only enabled for production to minimize latency globally.
 * Other stages use the default placement to reduce cost.
 *
 * @param stage - The resolved stage object from {@link getStage}.
 * @returns A placement config object, or `undefined` to use Cloudflare's default.
 */
function getPlacement({ id: stage, isDevMode }: Stage) {
  if (isDevMode) return undefined;
  switch (stage) {
    case 'production':
      return { mode: 'smart' } as const;
    case 'staging':
    case 'preview':
    case 'local':
      return undefined;
  }
}

const app = await alchemy('devsantara', {
  password: alchemyEnv.ALCHEMY_SECRET,
  stateStore: (scope) =>
    new CloudflareStateStore(scope, {
      scriptName: 'devsantara-deployment-service',
      stateToken: ALCHEMY_STATE_TOKEN,
    }),
});

const stage = getStage(app);
const domains = getDomains(stage);
const observability = getObservability(stage);
const placement = getPlacement(stage);
const url = domains?.[0] ? `https://${domains[0]}` : null;

export const worker = await TanStackStart('website', {
  adopt: true,
  wrangler: { main: 'src/entry.server.ts' },
  build: 'vp build',
  dev: { command: 'vp dev' },
  observability: observability,
  placement: placement,
  url: false,
  domains: domains,
  bindings: {
    // Environment variables
    VITE_BASE_URL: url ?? '',
  },
});

if (process.env.PULL_REQUEST) {
  const commitHash = process.env.GITHUB_SHA?.slice(0, 7) ?? 'unknown';
  const updatedAt = new Date(worker.updatedAt).toUTCString();

  // If this is a PR, add a comment to the PR with the preview URL
  // It will auto-update with each push
  await GitHubComment('preview-comment', {
    owner: 'devsantara',
    repository: 'website',
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `## 🚀 Preview Deployment (${process.env.PULL_REQUEST})

Your changes have been deployed to a preview environment:

| Name               | Preview URL             | Commit        | Updated (UTC) |
| :----------------- | :---------------------- | :------------ | :------------ |
| **${worker.name}** | [Visit Preview](${url}) | ${commitHash} | ${updatedAt}  |

---
<sub>🏗️ This comment updates automatically with each push.</sub>`,
  });
}

console.info({ app: app.name, worker: worker.name, url: url ?? 'localhost' });

await app.finalize();
