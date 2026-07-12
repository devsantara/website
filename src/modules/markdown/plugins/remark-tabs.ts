import type { PhrasingContent, Root, RootContent } from 'mdast';
import type { ContainerDirective } from 'mdast-util-directive';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

/** Container directive authors open with `:::tabs`. */
export const TABS_DIRECTIVE_NAME = 'tabs';
/** Leaf directive authors write as `::tab[Label]` to start a tab section. */
const TAB_DIRECTIVE_NAME = 'tab';

/** Flattens a phrasing-content subtree (e.g. a `::tab[...]` label) to plain text. */
function toText(nodes: PhrasingContent[]): string {
  return nodes
    .map((node) => {
      if ('value' in node) return node.value;
      if ('children' in node) return toText(node.children);
      return '';
    })
    .join('');
}

/** A single tab: its label and the blocks that render as its panel. */
type TabSection = { label: string; children: MdxJsxFlowElement['children'] };

/**
 * Rewrites `:::tabs` containers (parsed by `remark-directive`) into a
 * `<Tabs labels="...">` MDX element. `Tabs` must be provided through the MDX
 * components mapping. Each `::tab[Label]` marker starts a tab, and anything
 * may follow it — prose, lists, fences (with all their meta):
 *
 * ```md
 * :::tabs
 * ::tab[pnpm]
 * ...
 * ::tab[npm]
 * ...
 * :::
 * ```
 *
 * Inline and leaf directives (`:hover`, `::name`) found elsewhere are
 * unwrapped back to literal text: authors writing a bare colon-word almost
 * always mean the text itself, and leaving directive nodes in the tree
 * crashes mdast-to-hast.
 */
export function remarkTabs() {
  return (tree: Root, file: VFile) => {
    visit(tree, (node, index, parent) => {
      if (parent === undefined || index === undefined) return;
      const siblings = parent.children as RootContent[];

      if (node.type === 'textDirective') {
        siblings.splice(index, 1, { type: 'text', value: `:${node.name}` }, ...node.children);
        return index;
      }
      if (node.type === 'leafDirective') {
        if (node.name === TAB_DIRECTIVE_NAME) {
          file.fail(
            `"::${TAB_DIRECTIVE_NAME}" can only be used inside ":::${TABS_DIRECTIVE_NAME}".`,
            node,
          );
        }
        siblings.splice(index, 1, {
          type: 'paragraph',
          children: [{ type: 'text', value: `::${node.name}` }, ...node.children],
        });
        return index;
      }

      if (node.type !== 'containerDirective') return;
      const directive = node as ContainerDirective;
      if (directive.name !== TABS_DIRECTIVE_NAME) {
        file.fail(
          `Unknown directive ":::${directive.name}". Only ":::${TABS_DIRECTIVE_NAME}" is supported.`,
          directive,
        );
      }

      const sections = collectTabSections(directive, file);
      const tabs: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'Tabs',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'labels',
            value: JSON.stringify(sections.map((section) => section.label)),
          },
        ],
        // One wrapper element per tab so multi-block content stays 1:1 with
        // its label.
        children: sections.map((section) => ({
          type: 'mdxJsxFlowElement',
          name: 'div',
          attributes: [],
          children: section.children,
        })),
      };
      siblings[index] = tabs;
      // SKIP, or traversal would descend into the replaced (stale) directive
      // node and hit its already-consumed `::tab` leaves; resuming at the
      // same index visits the new Tabs element instead, so section content
      // still gets accidental inline directives unwrapped.
      return [SKIP, index];
    });
  };
}

/** `::tab[Label]` markers partition the container into sections. */
function collectTabSections(directive: ContainerDirective, file: VFile): TabSection[] {
  const sections: TabSection[] = [];
  for (const child of directive.children) {
    if (child.type === 'leafDirective' && child.name === TAB_DIRECTIVE_NAME) {
      const label = toText(child.children).trim();
      if (!label) {
        file.fail(
          `"::${TAB_DIRECTIVE_NAME}" needs a label, e.g. ::${TAB_DIRECTIVE_NAME}[First tab].`,
          child,
        );
      }
      sections.push({ label, children: [] });
      continue;
    }
    const current = sections.at(-1);
    if (!current) {
      file.fail(
        `Content inside ":::${TABS_DIRECTIVE_NAME}" must come after a "::${TAB_DIRECTIVE_NAME}[...]" marker.`,
        child,
      );
    }
    current.children.push(child as MdxJsxFlowElement['children'][number]);
  }
  if (sections.length === 0) {
    file.fail(
      `":::${TABS_DIRECTIVE_NAME}" must contain at least one "::${TAB_DIRECTIVE_NAME}[Label]" marker.`,
      directive,
    );
  }
  const empty = sections.find((section) => section.children.length === 0);
  if (empty) {
    file.fail(
      `"::${TAB_DIRECTIVE_NAME}[${empty.label}]" has no content — every tab needs at least one block.`,
      directive,
    );
  }
  return sections;
}
