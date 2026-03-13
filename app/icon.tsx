import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #043327 0%, #0b6f4f 55%, #2ecf82 100%)",
          color: "#ffffff",
          fontSize: 168,
          fontWeight: 800,
          letterSpacing: -8,
        }}
      >
        NG
      </div>
    ),
    size
  );
}
