import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }, // profile photos are resized in the browser to < 200 KB
  },
};

export default nextConfig;
