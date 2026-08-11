import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, Sparkles, FlaskConical, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assistant', label: 'Assistant', icon: Sparkles },
  { to: '/admin/experiments', label: 'Experiments', icon: FlaskConical, admin: true },
];

// Persistent left nav for the authenticated app shell (Dashboard/Assistant/
// Experiments). The public surface (Browse, auth pages) uses TopNav instead —
// see AppLayout.jsx for how routes pick between the two.
export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="hidden w-60 flex-col border-r border-border bg-background md:flex lg:w-64">
      <Link
        to="/"
        className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5 text-base font-medium tracking-tight text-foreground"
      >
        <Compass className="size-5 text-primary" />
        TravelZero
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Compass className="size-4" />
          Browse
        </Link>
        {NAV_ITEMS.map(({ to, label, icon: Icon, admin }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="size-4" />
              <span className="flex-1">{label}</span>
              {admin && (
                <Badge variant="secondary" className="text-[10px] leading-none">
                  Admin
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 border-t border-border px-4 py-3 text-left transition hover:bg-muted">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/64?img=47" alt="" />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-accent">{user?.loyaltyPoints?.toLocaleString() || 0}</span> pts
              </p>
            </div>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate font-medium text-foreground">{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} className="gap-2">
            <LogOut className="size-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
}
