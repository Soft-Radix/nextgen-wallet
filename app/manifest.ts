import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Next Generation Pay",
    short_name: "NextGen Pay",
    description: "Secure wallet transfers and real-time payment notifications.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3faf6",
    theme_color: "#0b6f4f",
    orientation: "portrait",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
