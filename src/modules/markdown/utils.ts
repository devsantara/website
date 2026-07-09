import { execFile as syncExecFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(syncExecFile);

// Resolve the last-modified timestamp from git history instead of fs mtime,
// which is unreliable in CI (fresh checkouts stamp every file with clone time).
// Falls back to the current time for files with no commits yet (new/uncommitted
// posts). Memoized via `ctx.cache`, so it only re-runs when the document changes.
export async function getLastModification(filePath: string) {
  const { stdout } = await execFile('git', ['log', '-1', '--format=%aI', '--', filePath]);
  if (stdout) {
    return new Date(stdout.trim()).toISOString();
  }
  return new Date().toISOString();
}
