'use client'
import dynamic from "next/dynamic";
import RouteSidebar from "./RouteSidebar";
// import MapView from "./MapView";

const MapView = dynamic(() => import("./MapView"), {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-2xl bg-gray-100 animate-pulse lg:w-2/3" />
    ),
  });
const LiveTracking = () => {
  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Sidebar */}
          <RouteSidebar />

          {/* Right Map */}
          <MapView />
        </div>
      </div>
    </section>
  );
};

export default LiveTracking;