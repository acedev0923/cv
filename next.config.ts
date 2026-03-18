import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/generate": ["./templates/**/*"],
    "/api/template": ["./templates/**/*"],
  },
};

export default nextConfig;
