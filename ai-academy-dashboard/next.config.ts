import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    // Briefing content - network first to always get fresh content
    {
      urlPattern: /\/api\/content\/day\/\d+/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "briefing-content",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [200], // Only cache successful responses
        },
      },
    },
    // Role-specific content - network first
    {
      urlPattern: /\/api\/content\/role\/[^/]+\/day\/\d+/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "role-content",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [200], // Only cache successful responses
        },
      },
    },
    // Mission day pages - network first with cache fallback
    {
      urlPattern: /\/mission\/day\/\d+/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "mission-pages",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
        networkTimeoutSeconds: 5,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Intel drops for offline viewing
    {
      urlPattern: /\/intel/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "intel-cache",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 5,
      },
    },
    // Supabase API calls
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // Use webpack for PWA support (next-pwa doesn't support Turbopack yet)
  turbopack: {},
};

export default withPWA(nextConfig);
