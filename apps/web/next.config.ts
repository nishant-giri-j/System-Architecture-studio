import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@architecture-studio/shared"],
  agentRules: false,
};

export default nextConfig;
