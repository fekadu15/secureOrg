import React, { useState, useEffect } from 'react';
import { systemApi } from '../services/api.js';
import { OrganizationalUnit } from '../types/index.js';

export const OrganizationalUnitsPage: React.FC = () => {
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    systemApi.listUnits()
      .then((res) => {
        if (res?.units) setUnits(res.units);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-space-lg">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
          Organizational Units & Hierarchy
        </h1>
        <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
          Departmental structures for identity scoping, manager delegation, and policy boundary management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
        {isLoading ? (
          <div className="col-span-full py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          units.map((unit) => (
            <div
              key={unit.id}
              className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">account_tree</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold bg-primary-fixed text-on-primary-fixed-variant px-2.5 py-0.5 rounded-full">
                    {unit.code}
                  </span>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface font-bold mt-2">{unit.name}</h3>
                <p className="font-body-sm text-[13px] text-on-surface-variant mt-1 leading-relaxed">
                  {unit.description || 'Organizational operational unit.'}
                </p>
              </div>

              <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between text-[12px]">
                <span className="text-on-surface-variant font-medium">Active Members</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  <span>{unit._count?.users || 0}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
