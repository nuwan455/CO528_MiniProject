"use client";

import React, { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (isAuthPage && isAuthenticated) {
      router.replace('/feed');
      return;
    }

    if (!isAuthPage && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthPage, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (isAuthPage) {
    if (isAuthenticated) {
      return null;
    }

    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-5xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
