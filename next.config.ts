import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config, { isServer }) => {
    // Handle tree-sitter native modules
    if (isServer) {
      config.externals.push({
        "tree-sitter": "commonjs tree-sitter",
      });
    }
    return config;
  },
};

export default nextConfig;
