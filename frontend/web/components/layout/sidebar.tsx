"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Briefcase,
  Calendar,
  Microscope,
  MessageSquare,
  Bell,
  BarChart2,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Research', href: '/research', icon: Microscope },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xl h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-primary">DECP.</h1>
        <p className="text-xs text-muted-foreground mt-1">Department Network</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}

        {user?.role === 'ADMIN' && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Admin
            </p>
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                pathname.startsWith('/admin')
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Shield className="w-4 h-4" />
              Moderation
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
            {user?.name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user?.name || 'Guest'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role || 'Visitor'}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
