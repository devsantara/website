import {
  InfoIcon,
  LightbulbIcon,
  MessageSquareWarningIcon,
  OctagonAlertIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import * as React from 'react';

/**
 * The five GitHub alert types, each mapped to its icon and visible label.
 * `remark-alert` lowercases the `[!TYPE]` marker into the `type` prop, and
 * `markdown.css` keys each type's accent color off the matching `[data-callout]`
 * attribute value.
 */
const ALERTS = {
  note: { icon: InfoIcon, label: 'Note' },
  tip: { icon: LightbulbIcon, label: 'Tip' },
  important: { icon: MessageSquareWarningIcon, label: 'Important' },
  warning: { icon: TriangleAlertIcon, label: 'Warning' },
  caution: { icon: OctagonAlertIcon, label: 'Caution' },
} as const;

type AlertType = keyof typeof ALERTS;

/**
 * Renders a GitHub-style alert (`> [!NOTE]`, `> [!WARNING]`, …) emitted by the
 * `remark-alert` plugin. The icon is decorative — the visible label already
 * names the alert — so it's hidden from assistive tech.
 *
 * @param props.type - One of the five alert types; supplied by `remark-alert`.
 * @param props.children - The alert body, already stripped of its `[!TYPE]` marker.
 */
export function Callout({ type, children }: { type: AlertType; children: React.ReactNode }) {
  const { icon: Icon, label } = ALERTS[type];
  return (
    <div data-callout={type}>
      <p data-callout-title>
        <Icon aria-hidden="true" />
        {label}
      </p>
      {children}
    </div>
  );
}
