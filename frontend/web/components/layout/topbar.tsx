"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, Menu } from 'lucide-react';
import api from "@/lib/api";
import { ApiResponse, NotificationRecord } from "@/lib/types";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data } = await api.get<ApiResponse<NotificationRecord[]>>("/notifications");
        setHasUnreadNotifications(data.data.some((notification) => !notification.isRead));
      } catch {
        setHasUnreadNotifications(false);
      }
    };

    void loadNotifications();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur-md">
      <div className="md:hidden flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-between gap-4 md:gap-8">
        <form className="flex-1 sm:max-w-md relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users, jobs, events..."
            className="w-full bg-accent/50 pl-9 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none rounded-full"
          />
        </form>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="relative rounded-full">
            <Link href="/notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {hasUnreadNotifications ? <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" /> : null}
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
