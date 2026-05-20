import type { NextConfig } from "next";

// `@injectivelabs/wallet-ledger` ships an inline UMD crypto-js inside
// `dist/esm/Eth-*.js` whose AMD branch contains `require('./sha256')`.
// That branch never executes at runtime (AMD detection fails in Node and
// webpack/turbopack), but the static analyser still tries to resolve the
// path and fails the build. Ignoring just that one resolve is safe.
const nextConfig: NextConfig = {
  webpack(config, { webpack }) {
    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/sha256$/,
        contextRegExp: /wallet-ledger/,
      }),
    );
    return config;
  },
};

export default nextConfig;
