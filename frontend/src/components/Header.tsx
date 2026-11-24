import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/audit-logs?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30 z-40 px-space-lg flex items-center justify-between">
      {/* Title / Current Path Indicator */}
      <div className="flex items-center gap-space-sm">
        <span className="font-title-md text-title-md text-primary font-bold">SecureOrg</span>
        <span className="text-outline-variant text-[16px]">/</span>
        <span className="font-label-sm text-[11px] font-semibold tracking-wider uppercase text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full">
          Production Enclave
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-space-md">
        {/* Global Search */}
        <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit, users, policies..."
            className="h-9 w-64 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-[13px] placeholder:text-on-surface-variant/70 border border-transparent focus:border-secondary focus:bg-surface-container-lowest focus:outline-none transition-all"
          />
        </form>

        {/* Current Date */}
        <span className="hidden lg:inline-block font-label-md text-[13px] text-on-surface-variant">
          {currentDate}
        </span>

        {/* Alerts Icon Link */}
        <Link
          to="/alerts"
          aria-label="Security Alerts"
          className="relative p-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-error text-on-error font-label-sm text-[10px] font-bold flex items-center justify-center">
            !
          </span>
        </Link>

        {/* User Quick Nav */}
        <div className="flex items-center gap-space-sm border-l border-outline-variant/30 pl-space-md">
          <Link
            to="/my-profile"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-[13px] hover:ring-2 hover:ring-secondary transition-all"
          >
            {user?.fullName?.charAt(0) || 'U'}
          </Link>
          <div className="hidden sm:flex items-center gap-space-xs text-[13px]">
            <Link to="/my-profile" className="font-label-md text-on-surface-variant hover:text-on-surface transition-colors">
              Profile
            </Link>
            
          </div>
        </div>
      </div>
    </header>
  );
};
