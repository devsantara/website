'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useRef, useState } from 'react';

import { Button } from '#/ui/components/core/button';

/** How long the copied-state checkmark stays visible before reverting to the copy icon. */
const COPY_FEEDBACK_DURATION_MS = 2000;

/**
 * Copies the rendered code of the enclosing rehype-pretty-code figure.
 * Reading the DOM (instead of receiving the source as a prop) keeps the code
 * out of the RSC payload twice, and lets us copy the block's end state:
 * `[!code]` markers are already stripped at render time and diff-removed
 * lines are skipped here.
 */
export function CodeCopyButton() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    const figure = event.currentTarget.closest('figure');
    if (!figure) return;

    const lines = Array.from(figure.querySelectorAll('pre code [data-line]'));
    const text =
      lines.length > 0
        ? lines
            .filter(
              (line) => !(line.classList.contains('diff') && line.classList.contains('remove')),
            )
            .map((line) => line.textContent ?? '')
            .join('\n')
        : (figure.querySelector('pre code')?.textContent ?? '');

    void navigator.clipboard.writeText(text);
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Copy code"
      data-copy-button
      className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
      onClick={handleCopy}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}
