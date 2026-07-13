import type { Blockquote, Root, RootContent } from 'mdast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import { SKIP, visit } from 'unist-util-visit';

/** The five GitHub alert types, uppercase as authored in the `[!TYPE]` marker. */
const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const;

/**
 * A leading alert marker occupying the blockquote's first line: `[!NOTE]` (one
 * of the five types, uppercase) followed by optional trailing spaces and then
 * either a soft break — the body continues in the same paragraph — or the end of
 * the text node — the body lives in later blocks. A marker that shares its line
 * with other text does not match, mirroring GitHub, which needs it alone on
 * line one.
 */
const ALERT_MARKER = new RegExp(String.raw`^\[!(${ALERT_TYPES.join('|')})\][^\S\n]*(?:\n|$)`);

/**
 * Rewrites GitHub-style alert blockquotes into `<Callout>` MDX elements.
 *
 * A blockquote whose first line is an alert marker —
 *
 * ```md
 * > [!WARNING]
 * > This needs your attention.
 * ```
 *
 * — becomes `<Callout type="warning">…</Callout>` with the marker stripped and
 * the rest of the blockquote preserved (prose, lists, code, and links all
 * survive). `Callout` must be provided through the MDX components mapping. A
 * blockquote without a recognized marker is left untouched as an ordinary quote,
 * and a lowercase or mistyped marker (`[!note]`, `[!HINT]`) renders literally —
 * matching GitHub, which is strict about the five uppercase names.
 */
export function remarkAlert() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (node.type !== 'blockquote' || parent === undefined || index === undefined) return;
      const blockquote = node as Blockquote;

      const opening = blockquote.children[0];
      if (opening?.type !== 'paragraph') return;
      const marker = opening.children[0];
      if (marker?.type !== 'text') return;

      const match = ALERT_MARKER.exec(marker.value);
      if (match === null) return;

      // Strip the marker from the opening paragraph. If it left an empty text
      // node, drop that; if the paragraph then holds nothing, drop it too so the
      // callout body starts cleanly at the next block.
      const remainder = marker.value.slice(match[0].length);
      if (remainder === '') {
        opening.children.shift();
        if (opening.children.length === 0) blockquote.children.shift();
      } else {
        marker.value = remainder;
      }

      const callout: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'Callout',
        attributes: [{ type: 'mdxJsxAttribute', name: 'type', value: match[1].toLowerCase() }],
        children: blockquote.children as MdxJsxFlowElement['children'],
      };
      (parent.children as RootContent[])[index] = callout;

      // Don't descend into the moved children: nothing inside is another alert
      // to rewrite, and GitHub alerts can't nest.
      return SKIP;
    });
  };
}
