import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: a gold coupe on onyx. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0b09" }}>
        <svg width="140" height="140" viewBox="0 0 512 512">
          <path d="M120 150 L392 150 L268 300 L244 300 Z" fill="#e0457f" />
          <path d="M108 140 L404 140 L268 304 L268 410 L330 430 L182 430 L244 410 L244 304 Z" fill="none" stroke="#d4af37" strokeWidth="18" strokeLinejoin="round" />
          <circle cx="356" cy="130" r="26" fill="#c2185b" stroke="#d4af37" strokeWidth="8" />
        </svg>
      </div>
    ),
    size,
  );
}
