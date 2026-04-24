/** @type {import('next').NextConfig} */
function resolveBackendApiBase() {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.METRICFLOW_API_URL;

  if (!configured) {
    return "http://localhost:4000/api/v1";
  }

  const trimmed = configured.replace(/\/$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

const nextConfig = {
  /**
   * Environment variable validation at build time.
   * Add any required public vars here so the build fails fast
   * if they're missing rather than silently using undefined.
   */
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },

  /**
   * API rewrites — allows the dashboard to proxy /api/* requests to
   * the MetricFlow backend without exposing the backend origin to the browser.
   *
   * Change NEXT_PUBLIC_API_BASE_URL in .env.local; no code changes needed.
   */
  async rewrites() {
    const backendUrl = resolveBackendApiBase();
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

  /**
   * Security headers — recommended baseline for production dashboards.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff"        },
          { key: "X-Frame-Options",            value: "DENY"           },
          { key: "Referrer-Policy",            value: "same-origin"    },
          { key: "X-XSS-Protection",           value: "1; mode=block"  },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
