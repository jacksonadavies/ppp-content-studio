import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PenSquare, Clapperboard, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../brand/Logo";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "../ui/dropdown-menu";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, id: "dashboard" },
  { to: "/studio", label: "Content Studio", icon: PenSquare, id: "studio" },
  { to: "/replayer", label: "PT Replayer", icon: Clapperboard, id: "replayer" },
];

export default function NavHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-[1500px] mx-auto px-5 h-16 flex items-center gap-8">
        <button data-testid="nav-logo" onClick={() => navigate("/")} className="shrink-0">
          <Logo size="text-lg" />
        </button>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`nav-${l.id}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-ppp-green bg-ppp-green/10" : "text-slate-300 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <l.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="user-menu-trigger" className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-colors">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-ppp-green/50"
                />
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-semibold text-white">{user?.name}</div>
                  <div className="text-[10px] text-ppp-green font-mono uppercase tracking-wider">{user?.role}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-ppp-panel border-white/10 text-white w-52">
              <DropdownMenuLabel className="text-slate-400 text-xs">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                data-testid="logout-btn"
                onClick={logout}
                className="text-red-400 focus:text-red-300 focus:bg-white/5 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
