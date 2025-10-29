/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // tất cả /api/... từ frontend
        destination: "http://localhost:5000/api/:path*", // chuyển sang backend
      },
    ];
  },
};

export default nextConfig;
