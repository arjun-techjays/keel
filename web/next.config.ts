import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  devIndicators: false,
  // ship the markdown guide with the /guide route so fs.readFile works on Vercel
  outputFileTracingIncludes: { "/guide": ["./src/content/user-guide.md"] },
  experimental: {
    // engagement snapshot zips are uploaded through server actions on push
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
