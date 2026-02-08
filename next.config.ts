import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.linear.app",
      },
      {
        protocol: "https",
        hostname: "*.linear.app",
      },
    ],
  },
};

export default nextConfig;
