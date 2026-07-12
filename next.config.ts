import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin root ke folder proyek (ada lockfile lain di C:\Users\El).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
