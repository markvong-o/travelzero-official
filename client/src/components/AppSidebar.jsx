import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, Sparkles, FlaskConical, MessageCircle, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import s from './AppSidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assistant', label: 'Assistant', icon: Sparkles },
  { to: '/gemini', label: 'Gemini', icon: MessageCircle },
  { to: '/admin/experiments', label: 'Experiments', icon: FlaskConical, admin: true },
];

// Persistent left nav for the authenticated app shell. The public surface uses
// TopNav instead — see AppLayout.jsx for how routes pick between the two.
export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={s.sidebar}>
      <Link to="/" className={s.brand}>
        <Compass size={20} className={s.brandIcon} />
        TravelZero
      </Link>

      <nav className={s.nav}>
        <Link to="/" className={s.link}>
          <Compass size={16} />
          Browse
        </Link>
        {NAV_ITEMS.map(({ to, label, icon: Icon, admin }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} className={cn(s.link, active && s.linkActive)}>
              <Icon size={16} />
              <span className={s.linkLabel}>{label}</span>
              {admin && (
                <Badge variant="secondary" style={{ fontSize: '10px', lineHeight: 1 }}>
                  Admin
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={s.account}>
            <Avatar>
              <AvatarFallback>{user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={s.accountInfo}>
              <p className={s.accountEmail}>{user?.email}</p>
              <p className={s.accountPts}>
                <span className={s.accountPtsValue}>
                  {user?.loyaltyPoints?.toLocaleString() || 0}
                </span>{' '}
                pts
              </p>
            </div>
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
    </aside>
  );
}
