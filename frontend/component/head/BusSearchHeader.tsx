"use client";

import { useState } from "react";
import { Search, ChevronDown, Map as MapIcon } from "lucide-react";
import type { RouteData } from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

type SearchProps = {
  searchTitle?: string;
  searchPlaceholder?: string;
  tileFirst?: string;
  firstOption?: string;
  titleSecond?: string;
  secondOption?: string;
  secondOptions?: string[];
  routes?: RouteData[];
  onSearch?: (query: string) => void;
  onRouteFilter?: (route: string) => void;
  onSecondFilter?: (value: string) => void;
  onViewMap?: () => void;
};

const BusSearchHeader = ({
  searchTitle = "Search  Routes/Stop",
  searchPlaceholder = "Enter stop or Route name",
  tileFirst = "Select Route",
  firstOption = "All Routes",
  titleSecond = "Direction",
  secondOption = "All Directions",
  secondOptions = ["Going", "Coming"],
  routes = [],
  onSearch,
  onRouteFilter,
  onSecondFilter,
  onViewMap,
}: SearchProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [selectedRoute, setSelectedRoute] = useState(firstOption);
  const [selectedDirection, setSelectedDirection] = useState(secondOption);

  const routeOptions = [
    firstOption,
    ...routes.map((r) => `${r.routeNo} - ${formatRouteName(r.from, r.to)}`),
  ];

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleRouteChange = (value: string) => {
    setSelectedRoute(value);
    if (onRouteFilter) {
      if (value === firstOption) {
        onRouteFilter("All Routes");
      } else {
        const routeNo = value.split(" - ")[0];
        onRouteFilter(routeNo);
      }
    }
  };

  const handleDirectionChange = (value: string) => {
    setSelectedDirection(value);
    onSecondFilter?.(value);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors">
      <div className="flex flex-col items-end gap-4 lg:flex-row">
        <div className="w-full flex-1">
          <label htmlFor="public-search" className="mb-2 block text-sm font-medium text-foreground">
            {searchTitle}
          </label>
          <div className="relative">
            <input
              id="public-search"
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="w-full lg:w-52">
          <label htmlFor="public-route-filter" className="mb-2 block text-sm font-medium text-foreground">
            {tileFirst}
          </label>
          <div className="relative">
            <select
              id="public-route-filter"
              value={selectedRoute}
              onChange={(e) => handleRouteChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {routeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-card text-foreground">
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="w-full lg:w-52">
          <label htmlFor="public-secondary-filter" className="mb-2 block text-sm font-medium text-foreground">
            {titleSecond}
          </label>
          <div className="relative">
            <select
              id="public-secondary-filter"
              value={selectedDirection}
              onChange={(e) => handleDirectionChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {[secondOption, ...secondOptions].map((opt) => (
                <option key={opt} value={opt} className="bg-card text-foreground">
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewMap?.()}
          className="flex h-10.5 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 lg:w-auto"
        >
          <MapIcon className="h-4 w-4" />
          View on Map
        </button>
      </div>
    </div>
  );
};

export default BusSearchHeader;
