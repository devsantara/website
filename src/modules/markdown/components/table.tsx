import * as React from 'react';

/**
 * Renders markdown tables (`table`) inside a horizontal scroll container.
 *
 * @tailwindcss/typography pins tables to `width: 100%`, so a wide table would
 * otherwise squeeze its columns unreadably narrow on small screens rather than
 * scroll. The `[data-table-wrapper]` div is the scroll boundary; markdown CSS
 * floors the table with a `min-width` so it overflows (and the wrapper scrolls)
 * once the viewport gets narrow, and moves the block margin onto the wrapper.
 */
export function Table(props: React.ComponentProps<'table'>) {
  return (
    <div data-table-wrapper>
      <table {...props} />
    </div>
  );
}
