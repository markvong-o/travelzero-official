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

const MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Browse', icon: Compass },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assistant', label: 'Assistant', icon: Sparkles },
  { to: '/admin/experiments', label: 'Experiments', icon: FlaskConical },
];

// Shell for the authenticated app (Dashboard/Assistant/Experiments): a
// persistent sidebar on md+ screens, a hamburger fallback below that, and
// the single place that gates these routes on a known user — individual
// pages no longer need their own isAnonymous redirect effect.
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
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <DropdownMenuItem key={to} asChild>
                  <Link to={to} className="gap-2">
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-sm font-medium text-foreground">TravelZero</span>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
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
