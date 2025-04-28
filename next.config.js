/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Increase the body size limit for server actions
    },
  },
}

module.exports = nextConfig
