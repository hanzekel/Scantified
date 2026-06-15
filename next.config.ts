import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevents clickjacking by denying iframe embedding
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevents the browser from guessing the MIME type
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self)", // Only allows the camera to be used on your domain
          },
        ],
      },
    ];
  },
};

export default nextConfig;