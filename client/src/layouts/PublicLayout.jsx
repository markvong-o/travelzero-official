import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from '../components/TopNav';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
