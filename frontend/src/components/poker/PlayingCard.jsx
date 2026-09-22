import React from "react";
import { rankOf, suitOf, SUIT_SYMBOL, SUIT_FACE_COLOR } from "../../lib/cards";

// A branded playing card. sizes: sm, md, lg
const SIZES = {
  xs: { w: 26, h: 36, r: 11, s: 11 },
  sm: { w: 34, h: 48, r: 13, s: 14 },
  md: { w: 46, h: 64, r: 16, s: 20 },
  lg: { w: 62, h: 88, r: 20, s: 28 },
};

export function PlayingCard({ card, faceDown = false, size = "md", className = "", testid }) {
  const S = SIZES[size] || SIZES.md;
  if (faceDown || !card) {
    return (
      <div
        data-testid={testid}
        className={`relative rounded-md overflow-hidden ${className}`}
        style={{
          width: S.w,
          height: S.h,
          background: "#0f2a12",
          border: "1.5px solid #9EE60F",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 3,
            borderRadius: 6,
            backgroundImage:
              "repeating-linear-gradient(45deg, #9EE60F 0 4px, transparent 4px 9px), repeating-linear-gradient(-45deg, #9EE60F 0 4px, transparent 4px 9px)",
            opacity: 0.85,
          }}
        />
      </div>
    );
  }
  const r = rankOf(card);
  const su = suitOf(card);
  const color = SUIT_FACE_COLOR[su] || "#0f172a";
  const sym = SUIT_SYMBOL[su] || "";
  return (
    <div
      data-testid={testid}
      className={`relative rounded-md bg-[#f6f7fa] card-shadow ${className}`}
      style={{ width: S.w, height: S.h, border: "1px solid #cbd0d6" }}
    >
      <div
        className="font-display font-extrabold leading-none"
        style={{ position: "absolute", top: 3, left: 4, color, fontSize: S.r }}
      >
        {r === "T" ? "10" : r}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: S.s }}>
        {sym}
      </div>
      <div
        className="font-display font-extrabold leading-none"
        style={{ position: "absolute", bottom: 3, right: 4, color, fontSize: S.r, transform: "rotate(180deg)" }}
      >
        {r === "T" ? "10" : r}
      </div>
    </div>
  );
}

export default PlayingCard;
