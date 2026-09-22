import React from "react";

// Official PPP logo (client-supplied). Never recreate typographically.
export function Logo({ className = "", height = 28, alt = "Practical Poker Plus" }) {
  return (
    <img
      src="/brand/logo-primary.png"
      alt={alt}
      draggable={false}
      style={{ height, width: "auto" }}
      className={`select-none ${className}`}
    />
  );
}

export default Logo;
