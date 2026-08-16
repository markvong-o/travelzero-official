import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { Button } from '@/components/ui/button';
import s from './PublicLayout.module.css';

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className={s.shell}>
      <TopNav />
      <main className={s.main}>
        <Outlet />
      </main>
      <Button
        asChild
        size="sm"
        variant="secondary"
        className={s.mobileFab}
        title="Preview TravelZero the way Emma sees it on her phone"
      >
        <Link to={`/mobile?preview=${encodeURIComponent(location.pathname)}`}>
          <Smartphone size={16} />
          View as Mobile App
        </Link>
      </Button>
    </div>
  );
}
