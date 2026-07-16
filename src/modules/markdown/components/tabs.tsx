import * as React from 'react';

import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from '#/ui/components/core/tabs';

/**
 * Tab group produced by the `:::tabs` directive (see `remark-tabs.ts`).
 * `labels` arrives JSON-encoded because MDX JSX attributes created by the
 * remark plugin are plain strings; children hold one wrapper div per
 * `::tab[Label]` section, in label order.
 */
export function Tabs({ labels, children }: { labels: string; children: React.ReactNode }) {
  const tabLabels = JSON.parse(labels) as string[];
  const panels = React.Children.toArray(children).filter((child) => React.isValidElement(child));

  return (
    <TabsRoot defaultValue={0} data-tabs>
      <TabsList>
        {tabLabels.map((label, index) => (
          <TabsTrigger key={`${index}-${label}`} value={index}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map((panel, index) => (
        <TabsContent key={`${index}-${tabLabels[index]}`} value={index}>
          {panel}
        </TabsContent>
      ))}
    </TabsRoot>
  );
}
