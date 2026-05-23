import type { NextConfig } from "next";

// Security headers applied to every response. Conservative set — no CSP
// here because wallet SDKs fetch from many RPC origins and inline-eval
// some bundled crypto, and a wrong CSP silently breaks the dapp. If we
// add CSP later it'll need: connect-src for every RPC + walletconnect
// relay, script-src 'unsafe-inline' 'unsafe-eval' for the bundled SDKs.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }, // no embedding our swap in iframes
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // X-XSS-Protection is deprecated; modern browsers use CSP instead.
];

// `@injectivelabs/wallet-ledger` ships an inline UMD crypto-js inside
// `dist/esm/Eth-*.js` whose AMD branch contains `require('./sha256')`.
// That branch never executes at runtime (AMD detection fails in Node and
// webpack/turbopack), but the static analyser still tries to resolve the
// path and fails the build. Ignoring just that one resolve is safe.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
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
