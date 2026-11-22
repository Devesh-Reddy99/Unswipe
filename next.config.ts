import type { NextConfig } from "next";

// Standard browser protections sent with every page
const securityHeaders = [
  // No other site may show Unswipe inside a frame (stops clickjacking)
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  // Browsers must trust the declared file type instead of guessing it
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites only see "unswipe-app.vercel.app", never the page or match ID someone came from
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app never needs the camera, microphone or location
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }, // profile photos are resized in the browser to < 200 KB
    // Keep pages you just opened for 30 s, so switching tabs back and forth is instant.
    // Any change you make (liking, sending, planning) clears this straight away.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
