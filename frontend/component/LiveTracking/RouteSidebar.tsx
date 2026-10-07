'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Clock3, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ExpandableList from '@/component/ui/ExpandableList';

type RouteSidebarProps = {
  title?: string;
  description?: string;
  showSearch?: boolean;
  routes: Route[];
  onSelect?: (index: number) => void;
  searchQuery?: string;
};

type Route = {
  number: string;
  route: string;
  frequency: string;
  status?: string;
  color: string;
  active: boolean;
  hasTracking?: boolean;
  activeBusCount?: number;
};

const RouteSidebar = ({
  title,
  description,
  showSearch = true,
  routes,
  onSelect,
  searchQuery: externalQuery,
}: RouteSidebarProps) => {
  const { t } = useLanguage();
  const [localSearch, setLocalSearch] = useState('');
  const search = externalQuery ?? localSearch;

  const filtered = routes.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.number.toLowerCase().includes(q) ||
      r.route.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-auto w-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors sm:p-6">
      <h3 className="mb-2 text-xl font-bold text-foreground">
        {title || t('tracking.title')}
      </h3>

      <p className="mb-6 text-sm text-muted-foreground">
        {description || t('tracking.subtitle')}
      </p>

      {showSearch && (
        <div className="relative mb-8">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={t('tracking.search_placeholder')}
            className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
          <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      )}

      <div className="pr-2 scrollbar-thin">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('tracking.popular_routes')}
        </h4>

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {t('tracking.no_routes')}
          </p>
        ) : (
          <ExpandableList
            items={filtered}
            initialCount={4}
            showMoreLabel={t('tracking.view_all_routes') || 'Show More Routes'}
            showLessLabel="Show Fewer Routes"
          >
            {(visibleFiltered) => (
              <div className="space-y-3">
                {visibleFiltered.map((route) => (
                  <button
                    type="button"
                    key={`${route.number}-${route.route}`}
                    onClick={() => {
                      const originalIndex = routes.indexOf(route);
                      onSelect?.(originalIndex);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-4 text-left transition-all ${
                      route.active
                        ? 'border-2 border-primary bg-primary/10'
                        : 'border border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${route.color}`}
                      >
                        {route.number}
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-foreground">
                          {route.route}
                        </h5>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {route.frequency}
                        </p>
                      </div>
                    </div>

                    {route.active ? (
                      <span className="rounded border border-primary/20 bg-primary/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        {route.status || t('tracking.on_time')}
                      </span>
                    ) : route.hasTracking ? (
                      <span className="rounded border border-info/30 bg-info/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-info">
                        {route.status || t('tracking.on_time')}
                      </span>
                    ) : (
                      <Clock3 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ExpandableList>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <Link
          href="/routes"
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          {t('tracking.view_all_routes')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default RouteSidebar;
