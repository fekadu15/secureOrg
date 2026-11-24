import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  badgeText?: string;
  badgeType?: 'primary' | 'secondary' | 'warning' | 'error' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  badgeText,
  badgeType = 'secondary'
}) => {
  const badgeClasses = {
    primary: 'bg-primary-fixed text-on-primary-fixed-variant',
    secondary: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    warning: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    error: 'bg-error-container text-on-error-container',
    success: 'bg-emerald-100 text-emerald-800'
  }[badgeType];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="font-label-md text-[13px] text-on-surface-variant font-medium">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-space-xs">
        <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
          {value}
        </span>
        {badgeText && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-semibold ${badgeClasses}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
