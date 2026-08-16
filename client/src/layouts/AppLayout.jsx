import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Compass, LayoutDashboard, Sparkles, FlaskConical, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppSidebar } from '../components/AppSidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import s from './AppLayout.module.css';

const MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Browse', icon: Compass },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assistant', label: 'Assistant', icon: Sparkles },
  { to: '/admin/experiments', label: 'Experiments', icon: FlaskConical },
];

// Shell for the authenticated app: a persistent sidebar on md+ screens, a
// hamburger fallback below that, and the single place that gates these routes
// on a known user.
export default function AppLayout() {
  const { isAnonymous, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && isAnonymous) {
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [loading, isAnonymous, navigate, location.pathname]);

  if (loading || isAnonymous) {
    return <div className={s.loading}>Loading…</div>;
  }

  return (
    <div className={s.shell}>
      <AppSidebar />
      <div className={s.main}>
        <header className={s.mobileHeader}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={s.hamburger} aria-label="Open navigation menu">
                <Menu size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" style={{ width: '12rem' }}>
              {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <DropdownMenuItem key={to} asChild className={s.menuItem}>
                  <Link to={to}>
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className={s.mobileTitle}>TravelZero</span>
        </header>
        <main className={s.content}>
          <Outlet />
        </main>
      </div>
      <Button
        asChild
        size="sm"
        variant="secondary"
        className={s.fab}
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
