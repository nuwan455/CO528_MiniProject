import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'DECP - Department Network',
  description: 'Department Engagement & Career Platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
