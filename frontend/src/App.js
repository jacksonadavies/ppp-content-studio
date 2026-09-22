import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavHeader from "./components/layout/NavHeader";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ContentStudio from "./pages/ContentStudio";
import Replayer from "./pages/Replayer";

function Shell({ children }) {
  return (
    <div className="hex-bg min-h-screen">
      <NavHeader />
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Shell><Dashboard /></Shell></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><Shell><ContentStudio /></Shell></ProtectedRoute>} />
            <Route path="/studio/:deckId" element={<ProtectedRoute><Shell><ContentStudio /></Shell></ProtectedRoute>} />
            <Route path="/replayer" element={<ProtectedRoute><Shell><Replayer /></Shell></ProtectedRoute>} />
            <Route path="/replayer/:replayId" element={<ProtectedRoute><Shell><Replayer /></Shell></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
