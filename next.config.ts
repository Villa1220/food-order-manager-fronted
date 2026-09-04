import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cuando tengamos las fotos reales del restaurante en un dominio/CDN,
      // se agrega aquí (ej: { hostname: "res.cloudinary.com" }).
    ],
  },
};

export default nextConfig;
