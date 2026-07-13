import Link from "next/link";
import { useState } from "react";
import { Search, Clock3, ArrowRight } from "lucide-react";

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
};

const RouteSidebar = ({
  title = "Track Your Bus Live",
  description = "Enter bus number or stop name to see live location.",
  showSearch = true,
  routes,
  onSelect,
  searchQuery: externalQuery,
}: RouteSidebarProps) => {
  const [localSearch, setLocalSearch] = useState("");
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
    <div className="flex h-[600px] w-full flex-col rounded-2xl bg-white p-6 shadow-md lg:w-1/3">
      <h3 className="mb-2 text-xl font-bold">{title}</h3>

      <p className="mb-6 text-sm text-gray-500">{description}</p>

      {showSearch && (
        <div className="relative mb-8">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Enter bus number or stop name..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-4 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Popular Routes
        </h4>

        <div className="space-y-3">
          {filtered.map((route, index) => (
            <div
              key={index}
              onClick={() => {
                // Find the original index in the unfiltered array
                const originalIndex = routes.indexOf(route);
                onSelect?.(originalIndex);
              }}
              className={`flex cursor-pointer items-center justify-between rounded-xl p-4 transition-all
                ${
                  route.active
                    ? "border-2 border-primary bg-green-50"
                    : "border border-gray-100 bg-white hover:border-gray-200"
                }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${route.color}`}
                >
                  {route.number}
                </div>

                <div>
                  <h5 className="text-sm font-semibold">{route.route}</h5>
                  <p className="mt-1 text-xs text-gray-500">
                    {route.frequency}
                  </p>
                </div>
              </div>

              {route.active ? (
                <span className="rounded border border-primary/20 bg-green-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {route.status || "Live"}
                </span>
              ) : route.hasTracking ? (
                <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  {route.status || "Live"}
                </span>
              ) : (
                <Clock3 className="h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400">
              No routes found.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <Link
          href="/routes"
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          View All Routes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default RouteSidebar;
