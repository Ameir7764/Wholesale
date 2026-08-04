import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable LightningCSS to avoid SWC native binary runtime crash on Windows Node v24
  experimental: {
    useLightningcss: false
  }
};

export default nextConfig;
