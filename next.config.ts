import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The PDF renderer reads the TTFs from disk at request time, so they have to
  // be traced into the serverless bundle explicitly.
  outputFileTracingIncludes: {
    "/api/**": ["./assets/fonts/**"],
  },
};

export default nextConfig;
