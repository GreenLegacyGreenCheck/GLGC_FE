import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GreenCheck",
    short_name: "GreenCheck",
    description: "고지서 기반 기후·에너지 자가진단 플랫폼",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef7f2",
    theme_color: "#1ba77d",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["utilities", "lifestyle"],
  };
}
