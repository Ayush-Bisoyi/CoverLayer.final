import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Zap, FileText, Shield, AlertCircle,
  Building2, BookOpen, Menu, X, ChevronRight, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Partners", icon: Building2, path: "/partners" },
  { label: "Risk Engine", icon: Zap, path: "/risk-engine" },
  { label: "Policy Catalog", icon: BookOpen, path: "/policy-catalog" },
  { label: "Policies", icon: Shield, path: "/policies" },
  { label: "Claims", icon: AlertCircle, path: "/claims" },
  { label: "Insurers", icon: FileText, path: "/insurers" },
  { label: "AI Assistant", icon: MessageSquare, path: "/assistant", highlight: true },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" style={{boxShadow:"0 0 16px rgba(13,188,167,0.35)"}}>
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-sm" style={{color:"hsl(174,72%,55%)"}}>Cover<span className="text-foreground">Layer</span></span>
            <div className="text-[10px] text-muted-foreground font-mono">AI InsurTech Platform</div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : item.highlight
                    ? "text-primary/80 hover:bg-primary/10 hover:text-primary border border-primary/10"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}>
                <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : item.highlight ? "text-primary/70" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-primary/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">API v2.4 · Live</span>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm" style={{color:"hsl(174,72%,55%)"}}>Cover<span className="text-foreground">Layer</span></span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
