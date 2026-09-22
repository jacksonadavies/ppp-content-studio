import React from "react";

// Real PPP branded playing cards (client assets). deck: "standard" | "fourcolour".
const SIZES = {
  xs: { w: 30, h: 42 },
  sm: { w: 40, h: 56 },
  md: { w: 52, h: 73 },
  lg: { w: 74, h: 104 },
};

export function PlayingCard({ card, faceDown = false, size = "md", deck = "fourcolour", className = "", testid }) {
  const S = SIZES[size] || SIZES.md;
  let src;
  if (faceDown || !card) src = "/brand/cards/back.png";
  else src = `/brand/cards/${deck === "standard" ? "standard" : "fourcolour"}/${card}.png`;
  return (
    <img
      src={src}
      data-testid={testid}
      alt={faceDown ? "card back" : card}
      draggable={false}
      className={`select-none ${className}`}
      style={{ width: S.w, height: S.h, objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.55))" }}
    />
  );
}

export default PlayingCard;
