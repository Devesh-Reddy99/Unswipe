import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }, // profile photos are resized in the browser to < 200 KB
    // Keep pages you just opened for 30 s, so switching tabs back and forth is instant.
    // Any change you make (liking, sending, planning) clears this straight away.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
