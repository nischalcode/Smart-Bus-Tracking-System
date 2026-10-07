"use client";

import { useState } from "react";
import TrackHeader from "../head/TrackHeader";
import TrackSidebar from "../sidebar/TrackSidebar";

const TrackLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh min-h-0 min-w-0 overflow-hidden">
      <TrackSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TrackHeader onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TrackLayout;
