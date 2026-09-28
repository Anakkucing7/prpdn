import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: { NEXT_PUBLIC_BASE_PATH: "" },

  output: "standalone",
  serverExternalPackages: ["pdfkit", "xlsx"],
  outputFileTracingIncludes: {"/api/admin/imports/[[...path]]": ["./scripts/parse-import.cjs", "./node_modules/xlsx/**/*"]},
  trailingSlash: true,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
