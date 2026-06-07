import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

const COVERAGE_TYPES = ["accident", "life", "liability", "property", "health", "travel", "cyber", "cargo"];
const CURRENCIES = ["USD", "EUR", "INR", "GBP", "BRL"];
const coverageIcons = { accident: "🚑", life: "🫀", liability: "⚖️", property: "🏠", health: "💊", travel: "✈️", cyber: "🔒", cargo: "📦" };

export default function PolicyCatalogPage() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", coverage_type: "accident", insurer_name: "", base_premium: "", currency: "USD", coverage_amount: "", duration_days: 30, status: "draft", exclusions: "", geographies: "" });

  useEffect(() => {
    base44.entities.PolicyCatalog.list("-created_date").then(data => { setCatalog(data); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const created = await base44.entities.PolicyCatalog.create({
      ...form,
      base_premium: parseFloat(form.base_premium),
      coverage_amount: parseFloat(form.coverage_amount),
      geographies: form.geographies ? form.geographies.split(",").map(s => s.trim()) : []
    });
    setCatalog(prev => [created, ...prev]);
    setOpen(false);
    setSaving(false);
  };

  const toggleStatus = async (policy) => {
    const newStatus = policy.status === "active" ? "inactive" : "active";
    await base44.entities.PolicyCatalog.update(policy.id, { status: newStatus });
    setCatalog(prev => prev.map(p => p.id === policy.id ? { ...p, status: newStatus } : p));
  };

  const filtered = catalog.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.insurer_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.coverage_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6">
      <PageHeader title="Policy Catalog" subtitle="Manage insurance products available for embedding"
        actions={<Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Add Policy</Button>}
      />
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-input border-border text-foreground h-9" placeholder="Search policies…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="bg-input border-border text-foreground h-9 w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-foreground">All Types</SelectItem>
            {COVERAGE_TYPES.map(t => <SelectItem key={t} value={t} className="text-foreground capitalize">{coverageIcons[t]} {t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No policies found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(policy => (
            <div key={policy.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{coverageIcons[policy.coverage_type] || "📋"}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{policy.name}</h3>
                    <p className="text-xs text-muted-foreground">{policy.insurer_name}</p>
                  </div>
                </div>
                <StatusBadge status={policy.status} />
              </div>
              {policy.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{policy.description}</p>}
              <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground">Premium</p>
                  <p className="font-mono font-bold text-primary mt-0.5">{policy.currency} {policy.base_premium}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground">Coverage</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">${(policy.coverage_amount / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">{policy.duration_days}d</p>
                </div>
              </div>
              {policy.geographies?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {policy.geographies.slice(0, 3).map(g => <span key={g} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-mono">{g}</span>)}
                  {policy.geographies.length > 3 && <span className="px-1.5 py-0.5 bg-muted/40 rounded text-xs text-muted-foreground">+{policy.geographies.length - 3}</span>}
                </div>
              )}
              <Button size="sm" variant="outline" className="w-full h-7 text-xs border-border" onClick={() => toggleStatus(policy)}>
                {policy.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">Add Policy to Catalog</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Policy Name *</label>
              <Input className="bg-input border-border text-foreground" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Gig Worker Accident Cover" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Coverage Type *</label>
                <Select value={form.coverage_type} onValueChange={v => setForm(f => ({...f, coverage_type: v}))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{COVERAGE_TYPES.map(t => <SelectItem key={t} value={t} className="text-foreground capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Insurer Name *</label>
                <Input className="bg-input border-border text-foreground" value={form.insurer_name} onChange={e => setForm(f => ({...f, insurer_name: e.target.value}))} placeholder="AXA, Zurich…" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Base Premium *</label>
                <Input type="number" className="bg-input border-border text-foreground" value={form.base_premium} onChange={e => setForm(f => ({...f, base_premium: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({...f, currency: v}))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{CURRENCIES.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration (days)</label>
                <Input type="number" className="bg-input border-border text-foreground" value={form.duration_days} onChange={e => setForm(f => ({...f, duration_days: parseInt(e.target.value)}))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Coverage Amount ($)</label>
              <Input type="number" className="bg-input border-border text-foreground" value={form.coverage_amount} onChange={e => setForm(f => ({...f, coverage_amount: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Geographies (comma separated)</label>
              <Input className="bg-input border-border text-foreground" value={form.geographies} onChange={e => setForm(f => ({...f, geographies: e.target.value}))} placeholder="US, IN, BR, GB…" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={2} className="bg-input border-border text-foreground resize-none" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="draft" className="text-foreground">Draft</SelectItem>
                  <SelectItem value="active" className="text-foreground">Active</SelectItem>
                  <SelectItem value="inactive" className="text-foreground">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.name || !form.insurer_name || !form.base_premium || saving}>
              {saving ? "Saving…" : "Add to Catalog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

const COVERAGE_TYPES = ["accident", "life", "liability", "property", "health", "travel", "cyber", "cargo"];
const CURRENCIES = ["USD", "EUR", "INR", "GBP", "BRL"];
const coverageIcons = { accident: "🚑", life: "🫀", liability: "⚖️", property: "🏠", health: "💊", travel: "✈️", cyber: "🔒", cargo: "📦" };

export default function PolicyCatalogPage() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", coverage_type: "accident", insurer_name: "", base_premium: "", currency: "USD", coverage_amount: "", duration_days: 30, status: "draft", exclusions: "", geographies: "" });

  useEffect(() => {
    base44.entities.PolicyCatalog.list("-created_date").then(data => { setCatalog(data); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const created = await base44.entities.PolicyCatalog.create({
      ...form,
      base_premium: parseFloat(form.base_premium),
      coverage_amount: parseFloat(form.coverage_amount),
      geographies: form.geographies ? form.geographies.split(",").map(s => s.trim()) : []
    });
    setCatalog(prev => [created, ...prev]);
    setOpen(false);
    setSaving(false);
  };

  const toggleStatus = async (policy) => {
    const newStatus = policy.status === "active" ? "inactive" : "active";
    await base44.entities.PolicyCatalog.update(policy.id, { status: newStatus });
    setCatalog(prev => prev.map(p => p.id === policy.id ? { ...p, status: newStatus } : p));
  };

  const filtered = catalog.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.insurer_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.coverage_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6">
      <PageHeader title="Policy Catalog" subtitle="Manage insurance products available for embedding"
        actions={<Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Add Policy</Button>}
      />
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-input border-border text-foreground h-9" placeholder="Search policies…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="bg-input border-border text-foreground h-9 w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-foreground">All Types</SelectItem>
            {COVERAGE_TYPES.map(t => <SelectItem key={t} value={t} className="text-foreground capitalize">{coverageIcons[t]} {t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No policies found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(policy => (
            <div key={policy.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{coverageIcons[policy.coverage_type] || "📋"}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{policy.name}</h3>
                    <p className="text-xs text-muted-foreground">{policy.insurer_name}</p>
                  </div>
                </div>
                <StatusBadge status={policy.status} />
              </div>
              {policy.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{policy.description}</p>}
              <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground">Premium</p>
                  <p className="font-mono font-bold text-primary mt-0.5">{policy.currency} {policy.base_premium}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground">Coverage</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">${(policy.coverage_amount / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">{policy.duration_days}d</p>
                </div>
              </div>
              {policy.geographies?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {policy.geographies.slice(0, 3).map(g => <span key={g} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-mono">{g}</span>)}
                  {policy.geographies.length > 3 && <span className="px-1.5 py-0.5 bg-muted/40 rounded text-xs text-muted-foreground">+{policy.geographies.length - 3}</span>}
                </div>
              )}
              <Button size="sm" variant="outline" className="w-full h-7 text-xs border-border" onClick={() => toggleStatus(policy)}>
                {policy.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">Add Policy to Catalog</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Policy Name *</label>
              <Input className="bg-input border-border text-foreground" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Gig Worker Accident Cover" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Coverage Type *</label>
                <Select value={form.coverage_type} onValueChange={v => setForm(f => ({...f, coverage_type: v}))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{COVERAGE_TYPES.map(t => <SelectItem key={t} value={t} className="text-foreground capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Insurer Name *</label>
                <Input className="bg-input border-border text-foreground" value={form.insurer_name} onChange={e => setForm(f => ({...f, insurer_name: e.target.value}))} placeholder="AXA, Zurich…" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Base Premium *</label>
                <Input type="number" className="bg-input border-border text-foreground" value={form.base_premium} onChange={e => setForm(f => ({...f, base_premium: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({...f, currency: v}))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{CURRENCIES.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration (days)</label>
                <Input type="number" className="bg-input border-border text-foreground" value={form.duration_days} onChange={e => setForm(f => ({...f, duration_days: parseInt(e.target.value)}))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Coverage Amount ($)</label>
              <Input type="number" className="bg-input border-border text-foreground" value={form.coverage_amount} onChange={e => setForm(f => ({...f, coverage_amount: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Geographies (comma separated)</label>
              <Input className="bg-input border-border text-foreground" value={form.geographies} onChange={e => setForm(f => ({...f, geographies: e.target.value}))} placeholder="US, IN, BR, GB…" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={2} className="bg-input border-border text-foreground resize-none" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="draft" className="text-foreground">Draft</SelectItem>
                  <SelectItem value="active" className="text-foreground">Active</SelectItem>
                  <SelectItem value="inactive" className="text-foreground">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.name || !form.insurer_name || !form.base_premium || saving}>
              {saving ? "Saving…" : "Add to Catalog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
