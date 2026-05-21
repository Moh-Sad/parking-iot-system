import { withNextVideo } from "next-video/process";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin Next to this directory so it doesn't auto-detect a parent lockfile.
  outputFileTracingRoot: path.resolve("."),
  turbopack: {
    root: path.resolve("."),
  },
};

export default withNextVideo(nextConfig);
