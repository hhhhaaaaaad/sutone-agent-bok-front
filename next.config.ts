import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactStrictMode: false,
  transpilePackages: [
    "@milkdown/crepe",
    "@milkdown/react",
    "@milkdown/core",
    "@milkdown/ctx",
    "@milkdown/kit",
    "@milkdown/plugin-math",
    "@milkdown/prose",
    "@milkdown/utils",
    "katex",
  ],
};

export default nextConfig;
