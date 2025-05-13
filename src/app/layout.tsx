import * as React from 'react';

import { fonts } from '~/styles/fonts';
import { cn } from '~/styles/utils';

import '~/styles/globals.css';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={cn(fonts.sans.variable, fonts.mono.variable, 'antialiased')}
    >
      <body>{children}</body>
    </html>
  );
}
