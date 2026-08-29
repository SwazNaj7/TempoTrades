'use client';

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopProfile } from '@/components/dashboard/top-profile';

const Content = memo(function Content({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] animate-fade-in p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-24">
      {children}
    </div>
  );
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
      <main
        className={cn(
          'min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'
        )}
      >
        <Content>{children}</Content>
      </main>
      <TopProfile />
    </div>
  );
}
