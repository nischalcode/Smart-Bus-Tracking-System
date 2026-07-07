"use client";

import { Search, ChevronDown, Map } from "lucide-react";
type SearchProps = {
  searchTitle?: string;
  tileFirst?: string;
  firstOption?: string;
  titleSecond?: string;
  secondOption?: string;
};
const BusSearchHeader = ({
  searchTitle=" Search Bus / Stop",
  tileFirst=" Select Route",
  firstOption="All Routes",
 titleSecond= "Direction",
secondOption = "All Direction"
}:SearchProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-end gap-4 lg:flex-row">
      
        <div className="w-full flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-800">
           {searchTitle}
          </label>

          <div className="relative">
            <input
              type="text"
              placeholder="Enter bus number or stop name"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-4 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />

            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        
        <div className="w-full lg:w-52">
          <label className="mb-2 block text-sm font-medium text-gray-800">
            {tileFirst}
          </label>

          <div className="relative">
            <select
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option>{firstOption}</option>
              <option>Route 12A</option>
              <option>Route 7B</option>
              <option>Route 9C</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

       
        <div className="w-full lg:w-52">
          <label className="mb-2 block text-sm font-medium text-gray-800">
            {titleSecond}
          </label>

          <div className="relative">
            <select
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option>{secondOption}</option>
              <option>City Center → Airport</option>
              <option>Airport → City Center</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

       
        <button className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white transition hover:bg-green-700 lg:w-auto">
          <Map className="h-4 w-4" />
          View on Map
        </button>
      </div>
    </div>
  );
};

export default BusSearchHeader;