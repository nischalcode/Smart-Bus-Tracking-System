'use client';

import { useState, useMemo, useEffect } from 'react';
import { ListFilter } from 'lucide-react';
import dynamic from 'next/dynamic';
import RouteSidebar from './RouteSidebar';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { NamedStop, fetchStopsByRoute } from '@/utils/api';
import { useLanguage } from '@/context/LanguageContext';
import { formatRouteName } from '@/utils/routeFormatter';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[28rem] w-full animate-pulse rounded-2xl bg-gray-100 md:h-[34rem]" />
  ),
});

const LiveTracking = () => {
  const { t } = useLanguage();
  const { routes, loadingRoutes, trackingByRouteId } = useLiveTracking();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [namedStops, setNamedStops] = useState<NamedStop[]>([]);
  const [mobileRoutesOpen, setMobileRoutesOpen] = useState(false);

  const sidebarRoutes = useMemo(() => {
    return routes.map((r, idx) => {
      const tracking = trackingByRouteId.get(r._id);

      return {
        number: r.routeNo,
        route: formatRouteName(r.from, r.to),
        frequency: `Every ${r.frequency}`,
        status: tracking?.status || r.status,
        color: r.color || 'bg-primary text-white',
        active: idx === selectedIndex,
        hasTracking: !!tracking,
      };
    });
  }, [routes, selectedIndex, trackingByRouteId]);

  const activeRoute = routes[selectedIndex];
  const activeRouteCoords = activeRoute?.pathCoordinates || [];
  const activeTracking = activeRoute
    ? trackingByRouteId.get(activeRoute._id)
    : undefined;

  useEffect(() => {
    if (!activeRoute?._id) return;

    fetchStopsByRoute(activeRoute._id)
      .then((data) => {
        setNamedStops(data?.stops || []);
      })
      .catch(console.error);
  }, [activeRoute?._id]);

  const mapCenter: [number, number] | undefined = activeTracking
    ? [activeTracking.latitude, activeTracking.longitude]
    : activeRouteCoords.length > 0
    ? activeRouteCoords[0]
    : undefined;

  return (
    <section className="bg-surface py-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMobileRoutesOpen((open) => !open)}
          aria-expanded={mobileRoutesOpen}
          aria-controls="live-tracking-routes"
          className="mb-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
        >
          <ListFilter className="h-4 w-4" aria-hidden="true" />
          {mobileRoutesOpen ? "Hide routes" : "Browse routes"}
        </button>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div id="live-tracking-routes" className={mobileRoutesOpen ? "lg:col-span-1" : "hidden lg:col-span-1 lg:block"}>
            {loadingRoutes ? (
              <div className="flex h-[28rem] w-full items-center justify-center rounded-2xl bg-card shadow-md md:h-[34rem] animate-pulse">
                <span className="text-gray-500 font-medium">
                  {t('common.loading')}
                </span>
              </div>
            ) : (
              <RouteSidebar
                routes={sidebarRoutes}
                title={t('tracking.title')}
                description={t('tracking.subtitle')}
                showSearch={true}
                onSelect={setSelectedIndex}
              />
            )}
          </div>

          <div className="col-span-1 w-full h-[28rem] min-w-0 md:h-[34rem]">
            <MapView
              center={mapCenter}
              routeCoordinates={activeRouteCoords}
              namedStops={namedStops}
              routeLabel={
                activeRoute
                  ? formatRouteName(activeRoute.from, activeRoute.to)
                  : undefined
              }
              showBus={!!activeTracking}
              busPosition={
                activeTracking
                  ? [activeTracking.latitude, activeTracking.longitude]
                  : undefined
              }
              busName={activeTracking?.bus?.busNumber || 'Bus'}
              speed={activeTracking?.speed}
              eta={activeTracking?.eta}
              nextStop={activeTracking?.nextStop}
              direction={activeTracking?.direction}
              stopETAs={activeTracking?.stopETAs}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveTracking;
