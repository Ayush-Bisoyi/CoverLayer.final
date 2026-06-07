import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { Shield, Zap, Building2, AlertCircle, TrendingUp, ArrowRight, DollarSign, Activity } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

const mockVolumeData = [
  { month: "Jan", premium: 42000 },
  { month: "Feb", premium: 58000 },
  { month: "Mar", premium: 51000 },
  { month: "Apr", premium: 79000 },
  { month: "May", premium: 94000 },
  { month: "Jun", premium: 112000 },
];

const mockRenewalData = [
  { month: "Jul", renewing: 12, new: 8 },
  { month: "Aug", renewing: 19, new: 11 },
  { month: "Sep", renewing: 15, new: 14 },
  { month: "Oct", renewing: 22, new: 9 },
];

const CLAIM_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];

const SkeletonRow = () => (
  <div className="h-10 bg-muted/40 rounded-lg animate-pulse" />
);

export default function Dashboard() {
  const [partners, setPartners] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [riskEvents, setRiskEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Partner.list(),
      base44.entities.Policy.list("-created_date", 5),
      base44.entities.Claim.list("-created_date", 5),
      base44.entities.RiskEvent.list("-created_date", 20),
    ]).then(([p, pol, c, re]) => {
      setPartners(p);
      setPolicies(pol);
      setClaims(c);
      setRiskEvents(re);
      setLoading(false);
    });
  }, []);

  const activePartners = partners.filter(p => p.status === "active").length;
  const activePolicies = policies.filter(p => p.status === "active").length;
  const openClaims = claims.filter(c => ["submitted", "under_review"].includes(c.status)).length;
  const totalPremium = policies.reduce((s, p) => s + (p.premium_paid || 0), 0);
  const totalClaimAmount = claims.reduce((s, c) => s + (c.claim_amount || 0), 0);
  const lossRatio = totalPremium > 0 ? ((totalClaimAmount / totalPremium) * 100).toFixed(1) : "0.0";

  const claimStatusCounts = ["submitted", "under_review", "approved", "rejected", "paid"].map(s => ({
    name: s.replace("_", " "),
    value: claims.filter(c => c.status === s).length
  })).filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time insurance infrastructure metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-400/10 border border-green-400/20 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-mono font-medium">All Systems Operational</span>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Gross Written Premium" value={loading ? "—" : `$${(totalPremium / 1000).toFixed(0)}K`} sub="Total collected" icon={DollarSign} trend="+18% MoM" trendUp accent />
        <StatCard label="Active Partners" value={loading ? "—" : activePartners} sub="Live integrations" icon={Building2} trend="+3 this month" trendUp />
        <StatCard label="Active Policies" value={loading ? "—" : activePolicies} sub="Across all partners" icon={Shield} />
        <StatCard label="Open Claims" value={loading ? "—" : openClaims} sub="Awaiting resolution" icon={AlertCircle} trend={openClaims > 3 ? "Needs attention" : "On track"} trendUp={openClaims <= 3} />
        <StatCard label="Loss Ratio" value={loading ? "—" : `${lossRatio}%`} sub="Claims / Premium" icon={Activity} trend={parseFloat(lossRatio) < 60 ? "Healthy" : "Above target"} trendUp={parseFloat(lossRatio) < 60} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground">Premium Written Over Time</h3>
            <p className="text-xs text-muted-foreground">Monthly GWP (USD)</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockVolumeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174,72%,38%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(174,72%,38%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#94a3b8" }} formatter={(v) => [`$${v.toLocaleString()}`, "Premium"]} />
              <Area type="monotone" dataKey="premium" stroke="hsl(174,72%,38%)" strokeWidth={2} fill="url(#premGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Claims by Status</h3>
              <p className="text-xs text-muted-foreground">Current distribution</p>
            </div>
            <Link to="/claims" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {loading ? (
            <div className="h-40 bg-muted/40 rounded-xl animate-pulse" />
          ) : claimStatusCounts.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No claims yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={claimStatusCounts} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {claimStatusCounts.map((_, i) => <Cell key={i} fill={CLAIM_COLORS[i % CLAIM_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: "#64748b" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Renewal Pipeline</h3>
            <p className="text-xs text-muted-foreground">Upcoming 4 months</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={mockRenewalData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="renewing" fill="hsl(174,72%,38%)" radius={[3,3,0,0]} name="Renewing" />
              <Bar dataKey="new" fill="hsl(174,72%,55%)" radius={[3,3,0,0]} name="New" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recently Issued Policies</h3>
            <Link to="/policies" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <SkeletonRow key={i} />)}</div>
          ) : policies.length === 0 ? (
            <div className="text-center py-10">
              <Shield className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No policies issued yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Policies appear here once partners integrate the Risk Engine</p>
              <Link to="/policies" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                <Shield className="w-3.5 h-3.5" /> Issue First Policy
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-2.5 text-xs font-medium text-muted-foreground">Policy #</th>
                    <th className="pb-2.5 text-xs font-medium text-muted-foreground">Coverage</th>
                    <th className="pb-2.5 text-xs font-medium text-muted-foreground">User</th>
                    <th className="pb-2.5 text-xs font-medium text-muted-foreground">Premium</th>
                    <th className="pb-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {policies.map(policy => (
                    <tr key={policy.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">{policy.policy_number || policy.id.slice(0, 8)}</td>
                      <td className="py-2.5 text-foreground font-medium text-xs">{policy.policy_name}</td>
                      <td className="py-2.5 text-muted-foreground text-xs">{policy.end_user_email}</td>
                      <td className="py-2.5 font-mono text-xs text-foreground">${(policy.premium_paid || 0).toFixed(2)}</td>
                      <td className="py-2.5"><StatusBadge status={policy.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
