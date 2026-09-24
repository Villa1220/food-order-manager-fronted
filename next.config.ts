import type { NextConfig } from "next";

const CLOUD_API = "http://2.28.111.55:4000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "2.28.111.55", port: "4000", pathname: "/uploads/**" },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${CLOUD_API}/api/:path*` },
      { source: "/uploads/:path*", destination: `${CLOUD_API}/uploads/:path*` },
      { source: "/socket.io/:path*", destination: `${CLOUD_API}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
