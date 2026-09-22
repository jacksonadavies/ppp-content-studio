import React from "react";

// Real PPP branded chips (client assets). Picks nearest denomination image.
const DENOMS = [1, 5, 25, 100, 1000, 5000];

export function Chip({ size = 26, value = 25, className = "" }) {
  let denom = DENOMS[0];
  for (const d of DENOMS) if (value >= d) denom = d;
  return (
    <img
      src={`/brand/chips/chip-${denom}.png`}
      alt={`${denom} chip`}
      draggable={false}
      className={`select-none ${className}`}
      style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }}
    />
  );
}

export default Chip;
