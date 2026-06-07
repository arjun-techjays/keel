import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  devIndicators: false,
  experimental: {
    // engagement snapshot zips are uploaded through server actions on push
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
