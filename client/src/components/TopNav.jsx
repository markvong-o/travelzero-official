import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAuth0Configured, getAuth0Config } from '../lib/auth-config';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import s from './TopNav.module.css';

// Public-surface nav — sits above Browse (and the auth pages). The
// authenticated app (Dashboard/Assistant/Experiments) uses AppSidebar instead.
export function TopNav() {
  const { user, isAnonymous, sessionId, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={s.nav}>
      <div className={s.inner}>
        <Link to="/" className={s.logo}>
          <Compass size={20} className={s.logoIcon} />
          TravelZero
        </Link>

        <Badge
          variant="secondary"
          className={s.demoBadge}
          title={isAuth0Configured() ? `Connected to ${getAuth0Config().domain}` : 'Running against the mock Auth0 server'}
        >
          {isAuth0Configured() ? `Connected: ${getAuth0Config().domain}` : 'Demo Mode'}
        </Badge>

        <div className={s.spacer} />

        {isAnonymous ? (
          <div className={s.group}>
            <Badge variant="secondary" className={s.guestBadge}>
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
          <div className={`${s.group} ${s.groupWide}`}>
            <span className={s.pts}>
              <span className={s.ptsValue}>{user?.loyaltyPoints?.toLocaleString() || 0}</span> pts
            </span>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={s.avatarTrigger}>
                  <Avatar>
                    <AvatarFallback>{user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown size={14} className={s.chevron} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ width: '14rem' }}>
                <DropdownMenuLabel className={s.menuLabel}>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut size={16} />
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
