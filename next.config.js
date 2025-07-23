/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
    N8N_STREAMING_URL: process.env.N8N_STREAMING_URL,
  },
}

module.exports = nextConfig