import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, sub, trend, trendUp, icon: Icon, accent }) {
  return (
    <div className={cn(
      "relative bg-card border border-border rounded-xl p-5 overflow-hidden transition-all duration-200 hover:border-primary/20 hover:glow-blue",
      accent && "border-primary/20 glow-blue"
    )}>
      {accent && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-foreground font-mono leading-none">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trendUp ? "text-green-400" : "text-red-400")}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
