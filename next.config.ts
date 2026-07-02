import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["fake-ff", "@napi-rs/canvas", "iqc-canvas", "emoji-db"],
  outputFileTracingIncludes: {
    "/api/iqc-text":   [
      "./node_modules/emoji-db/src/database/**",
      "./node_modules/emoji-db/src/**",
      "./node_modules/iqc-canvas/assets/**",
      "./node_modules/iqc-canvas/lib/**",
      "./node_modules/iqc-canvas/**",
    ],
    "/iqc-text": [
      "./node_modules/emoji-db/src/database/**",
      "./node_modules/emoji-db/src/**",
      "./node_modules/iqc-canvas/assets/**",
      "./node_modules/iqc-canvas/lib/**",
      "./node_modules/iqc-canvas/**",
    ],
  },
};

export default nextConfig;
