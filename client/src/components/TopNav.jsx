import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAuth0Configured, getAuth0Config } from '../lib/auth-config';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Public-surface nav — sits above Browse (and the auth pages). The
// authenticated app (Dashboard/Assistant/Experiments) uses AppSidebar
// instead, so this only needs a logo, the demo-mode indicator, and an
// entry point into the auth routes or the app shell.
export function TopNav() {
  const { user, isAnonymous, sessionId, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-medium tracking-tight text-foreground">
          <Compass className="size-5 text-primary" />
          TravelZero
        </Link>

        <Badge
          variant="secondary"
          className="hidden shrink-0 text-[10px] font-normal md:inline-flex"
          title={isAuth0Configured() ? `Connected to ${getAuth0Config().domain}` : 'Running against the mock Auth0 server'}
        >
          {isAuth0Configured() ? `Connected: ${getAuth0Config().domain}` : 'Demo Mode'}
        </Badge>

        <div className="flex-1" />

        {isAnonymous ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden gap-1.5 font-normal sm:inline-flex">
              Guest &bull; {sessionId?.substring(0, 6)}
            </Badge>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              <span className="font-medium text-accent">{user?.loyaltyPoints?.toLocaleString() || 0}</span> pts
            </span>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
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
