import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ end_user_email: "", end_user_name: "", policy_name: "", coverage_type: "accident", insurer_name: "", premium_paid: "", currency: "USD", coverage_amount: "", start_date: "", end_date: "", partner_id: "", jurisdiction: "" });

  useEffect(() => {
    Promise.all([base44.entities.Policy.list("-created_date"), base44.entities.Partner.list()])
      .then(([pol, par]) => { setPolicies(pol); setPartners(par); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const partner = partners.find(p => p.id === form.partner_id);
    const created = await base44.entities.Policy.create({
      ...form,
      policy_number: "POL-" + Date.now().toString(36).toUpperCase(),
      partner_name: partner?.company_name || "",
      premium_paid: parseFloat(form.premium_paid),
      coverage_amount: parseFloat(form.coverage_amount),
      status: "active"
    });
    setPolicies(prev => [created, ...prev]);
    setOpen(false);
    setSaving(false);
  };

  const filtered = policies.filter(p => {
    const matchSearch = [p.end_user_email, p.policy_name, p.policy_number, p.partner_name].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6">
      <PageHeader title="Issued Policies" subtitle="All policies issued across partner platforms"
        actions={<Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Issue Policy</Button>}
      />
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-input border-border text-foreground h-9" placeholder="Search by user, policy name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="bg-input border-border text-foreground h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            {["all","active","expired","cancelled","claimed"].map(s => (
              <SelectItem key={s} value={s} className="text-foreground capitalize">{s === "all" ? "All Status" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
          <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No policies found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Policy #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Coverage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Policyholder</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Partner</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Premium</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Period</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(policy => (
                  <tr key={policy.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{policy.policy_number || policy.id.slice(0,8)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-xs">{policy.policy_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{policy.coverage_type}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-foreground">{policy.end_user_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{policy.end_user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{policy.partner_name || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{policy.currency} {(policy.premium_paid || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {policy.start_date ? format(new Date(policy.start_date), "MMM d") : "—"}
                      {policy.end_date ? ` → ${format(new Date(policy.end_date), "MMM d, yy")}` : ""}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={policy.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">Issue Policy</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">User Email *</label>
                <Input className="bg-input border-border text-foreground" value={form.end_user_email} onChange={e => setForm(f => ({...f, end_user_email: e.target.value}))} placeholder="user@example.com" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">User Name</label>
                <Input className="bg-input border-border text-foreground" value={form.end_user_name} onChange={e => setForm(f => ({...f, end_user_name: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Policy Name *</label>
              <Input className="bg-input border-border text-foreground" value={form.policy_name} onChange={e => setForm(f => ({...f, policy_name: e.target.value}))} placeholder="e.g. Gig Worker Accident Cover" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Coverage Type</label>
                <Select value={form.coverage_type} onValueChange={v => setForm(f => ({...f, coverage_type: v}))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["accident","life","liability","property","health","travel","cyber","cargo"].map(t => (
                      <SelectItem key={t} value={t} className="text-foreground capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Insurer</label>
                <Input className="bg-input border-border text-foreground" value={form.insurer_name} onChange={e => setForm(f => ({...f, insurer_name: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Premium *</label>
                <Input type="number" className="bg-input border-border text-foreground" value={form.premium_paid} onChange={e => setForm(f => ({...f, premium_paid: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({...f, currency: v}))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["USD","EUR","INR","GBP","BRL"].map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Coverage ($)</label>
                <Input type="number" className="bg-input border-border text-foreground" value={form.coverage_amount} onChange={e => setForm(f => ({...f, coverage_amount: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                <Input type="date" className="bg-input border-border text-foreground" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                <Input type="date" className="bg-input border-border text-foreground" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Partner</label>
              <Select value={form.partner_id} onValueChange={v => setForm(f => ({...f, partner_id: v}))}>
                <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {partners.map(p => <SelectItem key={p.id} value={p.id} className="text-foreground">{p.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.end_user_email || !form.policy_name || !form.premium_paid || saving}>
              {saving ? "Issuing…" : "Issue Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
