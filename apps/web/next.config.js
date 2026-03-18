/** @type {import('next').NextConfig} */

// Ensure the API URL always has a protocol prefix.
// Render/Railway fromService env vars expose just the hostname (no https://),
// so we auto-prepend https:// when the value has no protocol.
function withProtocol(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

const NEXT_PUBLIC_API_URL =
  withProtocol(process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000';

const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
