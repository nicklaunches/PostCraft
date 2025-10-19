/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["geist"],
  env: {
    // Proxy POSTCRAFT_ variables to the client
    POSTCRAFT_UNLAYER_PROJECT_ID: process.env.POSTCRAFT_UNLAYER_PROJECT_ID,
  },
};

module.exports = config;
