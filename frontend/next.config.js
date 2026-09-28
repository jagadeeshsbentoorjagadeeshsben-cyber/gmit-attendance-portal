const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Pin the workspace root to this app so PostCSS/Tailwind config is picked up
  // correctly (the environment has lockfiles higher up the tree).
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: [
    "03aba25e-8c49-42b6-8622-69ed06287e75.preview.emergentagent.com",
    "03aba25e-8c49-42b6-8622-69ed06287e75.cluster-3.preview.emergentcf.cloud",
    "*.preview.emergentagent.com",
    "*.preview.emergentcf.cloud",
  ],
};

module.exports = nextConfig;
