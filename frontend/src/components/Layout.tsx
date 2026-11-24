import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <Sidebar />
      <Header />
      <main className="pl-[260px] pt-16 min-h-screen">
        <div className="p-space-lg max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
