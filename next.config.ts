import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '14mb',
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: "autodiag-ia",
  project: "autodiag-oficial",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
  sourcemaps: { disable: true },
  disableLogger: true,
});
