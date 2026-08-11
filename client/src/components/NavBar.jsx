import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, Sparkles, FlaskConical, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAuth0Configured, getAuth0Config } from '../lib/auth-config';
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

const NAV_LINKS = [
  { to: '/', label: 'Browse', icon: Compass, public: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assistant', label: 'Assistant', icon: Sparkles },
  { to: '/admin/experiments', label: 'Experiments', icon: FlaskConical, admin: true },
];

export function NavBar() {
  const { user, isAnonymous, sessionId, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const visibleLinks = NAV_LINKS.filter((link) => link.public || user);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 md:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-medium tracking-tight text-foreground">
          <Compass className="size-5 text-accent" />
          TravelZero
        </Link>

        <Badge
          variant="secondary"
          className="hidden shrink-0 text-[10px] font-normal md:inline-flex"
          title={isAuth0Configured() ? `Connected to ${getAuth0Config().domain}` : 'Running against the mock Auth0 server'}
        >
          {isAuth0Configured() ? `Connected: ${getAuth0Config().domain}` : 'Demo Mode'}
        </Badge>

        <div className="hidden flex-1 items-center gap-1 md:flex">
          {visibleLinks.map(({ to, label, icon: Icon, admin }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-4" />
              <span>{label}</span>
              {admin && (
                <Badge variant="secondary" className="ml-0.5 text-[10px] leading-none">
                  Admin
                </Badge>
              )}
            </Link>
          ))}
        </div>
        <div className="flex-1 md:hidden" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {visibleLinks.map(({ to, label, icon: Icon }) => (
              <DropdownMenuItem key={to} asChild>
                <Link to={to} className="gap-2">
                  <Icon className="size-4" />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {isAnonymous ? (
          <Badge variant="secondary" className="gap-1.5 font-normal">
            Guest &bull; {sessionId?.substring(0, 6)}
          </Badge>
        ) : (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              <span className="font-medium text-accent">{user?.loyaltyPoints?.toLocaleString() || 0}</span> pts
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full transition hover:opacity-80">
                  <Avatar>
                    <AvatarImage src="https://i.pravatar.cc/64?img=47" alt="" />
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-medium text-foreground">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="gap-2">
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
}
