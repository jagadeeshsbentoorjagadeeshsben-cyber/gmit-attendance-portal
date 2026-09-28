import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GMIT Smart Attendance",
    short_name: "GMIT Attend",
    description: "A smart attendance companion for GMIT students.",
    start_url: "/",
    display: "standalone",
    background_color: "#050B18",
    theme_color: "#071A3D",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
