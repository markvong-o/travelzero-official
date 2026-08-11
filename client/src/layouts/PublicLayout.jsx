import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { Button } from '@/components/ui/button';

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Button
        asChild
        size="sm"
        variant="secondary"
        className="fixed bottom-6 right-6 z-40 gap-2 rounded-full shadow-lg"
        title="Preview TravelZero the way Emma sees it on her phone"
      >
        <Link to={`/mobile?preview=${encodeURIComponent(location.pathname)}`}>
          <Smartphone className="size-4" />
          View as Mobile App
        </Link>
      </Button>
    </div>
  );
}
