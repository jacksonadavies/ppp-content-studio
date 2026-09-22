import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./brand/Logo";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="hex-bg min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Logo stacked className="text-3xl opacity-70" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
