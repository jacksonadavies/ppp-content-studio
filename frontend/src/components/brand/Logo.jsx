import React from "react";

// Typographic recreation of the PRACTICAL POKER + wordmark.
export function Logo({ className = "", size = "text-xl", stacked = false }) {
  if (stacked) {
    return (
      <div className={`font-display font-extrabold leading-[0.85] tracking-tight ${className}`}>
        <div className="text-white">PRACTICAL</div>
        <div className="text-white">
          POKER <span className="text-ppp-green neon-text">+</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`font-display font-extrabold tracking-tight text-white ${size} ${className}`}>
      PRACTICAL POKER <span className="text-ppp-green neon-text">+</span>
    </div>
  );
}

export default Logo;
