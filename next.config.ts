import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: { NEXT_PUBLIC_BASE_PATH: "" },

  output: "standalone",
  trailingSlash: true,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
