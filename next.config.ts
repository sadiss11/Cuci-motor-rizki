import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/pitch": ["./docs/**/*"], "/prospektus": ["./docs/**/*"] },
};

export default nextConfig;
