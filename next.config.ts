import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hotelassets.rankanalytics.in",
      },
    ],
  },
};

export default nextConfig;
