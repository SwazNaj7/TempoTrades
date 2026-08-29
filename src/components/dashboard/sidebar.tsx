'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Calculator,
  BarChart3,
  Menu,
  X,
  BookOpen,
  Plus,
  PanelLeftClose,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Journal', href: '/dashboard/journal', icon: BookOpen },
  { name: 'Analytics', href: '/dashboard/analysis', icon: BarChart3 },
  { name: 'Trade Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Lot Size Calculator', href: '/dashboard/calculator', icon: Calculator },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const show = !collapsed || mobileOpen;
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden bg-sidebar border-r border-sidebar-border transition-[width,transform] duration-300 ease-in-out w-64',
          'lg:translate-x-0',
          collapsed ? 'lg:w-[76px]' : 'lg:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div
          className={cn(
            'relative flex h-16 shrink-0 items-center border-b border-sidebar-border/60 px-4',
            show ? 'justify-between' : 'justify-center'
          )}
        >
          {show ? (
            <>
              <span className="text-base font-light tracking-[0.16em] text-foreground">
                TempoTrades
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:inline-flex"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {collapsed ? <Menu className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:inline-flex"
              aria-label="Expand sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        <Separator className="opacity-60 shrink-0" />

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 pt-6">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={show ? undefined : item.name}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors',
                  show ? 'px-3 justify-start' : 'px-0 justify-center',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                {active && (
                  <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {show && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn('shrink-0 px-3 pb-3 pt-2', !show && 'flex justify-center px-0')}>
          {show ? (
            <Button
              asChild
              className="w-full justify-center gap-2 rounded-xl transition-all duration-300"
            >
              <Link href="/dashboard/trade" onClick={() => setMobileOpen(false)}>
                <Plus className="h-4 w-4 shrink-0" />
                <span>Add New Trade</span>
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              aria-label="Add New Trade"
              className="flex h-10 w-10 rounded-full p-0 transition-all duration-300"
            >
              <Link href="/dashboard/trade" onClick={() => setMobileOpen(false)}>
                <Plus className="h-4 w-4 shrink-0" />
              </Link>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
