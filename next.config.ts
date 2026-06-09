import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  outputFileTracingIncludes: {
    "/*": ["src/db/worldcup.db"],
  },
};

export default nextConfig;
