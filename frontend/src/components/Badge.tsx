import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'SUSPENDED' | 'DEACTIVATED' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SUCCESS' | 'INFO';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'INFO' }) => {
  const getStyle = () => {
    switch (variant) {
      case 'ACTIVE':
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PENDING':
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOCKED':
      case 'SUSPENDED':
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-error-container text-on-error-container border-error/30';
      case 'DEACTIVATED':
      case 'LOW':
        return 'bg-surface-container-high text-on-surface-variant border-outline-variant/40';
      default:
        return 'bg-secondary-fixed text-on-secondary-fixed-variant border-secondary-container';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStyle()}`}>
      {label}
    </span>
  );
};
