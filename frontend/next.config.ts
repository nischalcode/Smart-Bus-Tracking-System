import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next.js from walking up to the monorepo root and getting confused
    // by the root-level pnpm-workspace.yaml / lockfile.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
