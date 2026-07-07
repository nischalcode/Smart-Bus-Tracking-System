'use client'
import dynamic from "next/dynamic";
import RouteSidebar from "./RouteSidebar";

const routes = [
  {
    number: "12A",
    route: "City Center → Airport",
    frequency: "Every 10 min",
    status: "Live",
    color: "bg-primary text-white",
    active: true,
  },
  {
    number: "7B",
    route: "Central Park → Tech Hub",
    frequency: "Every 12 min",
    color: "bg-blue-100 text-blue-600",
    active: false,
  },
  {
    number: "9C",
    route: "Railway Station → City Center",
    frequency: "Every 15 min",
    color: "bg-purple-100 text-purple-600",
    active: false,
  },
  {
    number: "4D",
    route: "University → Market Street",
    frequency: "Every 20 min",
    color: "bg-yellow-100 text-yellow-600",
    active: false,
  },
];
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
          <RouteSidebar routes={routes} />

          {/* Right Map */}
          <MapView />
        </div>
      </div>
    </section>
  );
};

export default LiveTracking;