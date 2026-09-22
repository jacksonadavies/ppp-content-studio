import React from "react";

// Branded neon-green poker chip with optional value label.
export function Chip({ size = 20, label, className = "" }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #c6ff4d, #9EE60F 55%, #6f9e08 100%)",
          border: "2px solid #0d0d0d",
          boxShadow: "0 0 6px rgba(158,230,15,0.6), 0 2px 4px rgba(0,0,0,0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: size * 0.18,
          borderRadius: "50%",
          border: "1.5px dashed rgba(13,13,13,0.6)",
        }}
      />
      {label != null && (
        <span className="absolute font-mono text-[9px] font-bold text-black">{label}</span>
      )}
    </div>
  );
}

export default Chip;
