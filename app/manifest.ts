import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Drink Palooza",
    short_name: "Palooza",
    description: "Make a cocktail. Present it. Get poured a score.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0b09",
    theme_color: "#0d0b09",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
