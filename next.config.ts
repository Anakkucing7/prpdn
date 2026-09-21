import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/prpdn" : "" },

  output: "export",
  trailingSlash: true,

  basePath: isGitHubPages ? "/prpdn" : "",
  assetPrefix: isGitHubPages ? "/prpdn" : "",

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
