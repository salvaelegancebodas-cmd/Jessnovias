/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Ajustar cuando se conozca el proveedor final de almacenamiento de
    // imágenes (S3, Cloudinary, Vercel Blob...)
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
