/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // got-scraping (and its header-generator dep) ship data files loaded via fs.readFileSync.
  // Bundling them through webpack drops those files; mark them external so they load from
  // node_modules at runtime instead.
  serverExternalPackages: ["got-scraping", "header-generator"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "makerworld.com" },
      { protocol: "https", hostname: "**.bambulab.com" },
    ],
  },
};

export default nextConfig;
