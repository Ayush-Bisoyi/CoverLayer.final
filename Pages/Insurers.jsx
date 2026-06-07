import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

export default function Insurers() {
  const [insurers, setInsurers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", country: "", license_number: "", regulatory_body: "", contact_email: "", status: "pending", supported_currencies: "USD", supported_verticals: "" });

  useEffect(() => {
    base44.entities.InsurerPartner.list("-created_date").then(data => { setInsurers(data); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const created = await base44.entities.InsurerPartner.create({
      ...form,
      supported_currencies: form.supported_currencies ? form.supported_currencies.split(",").map(s => s.trim()) : ["USD"],
      supported_verticals: form.supported_verticals ? form.supported_verticals.split(",").map(s => s.trim()) : []
    });
    setInsurers(prev => [created, ...prev]);
    setOpen(false);
    setSaving(false);
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.InsurerPartner.update(id, { status });
    setInsurers(prev => prev.map(ins => ins.id === id ? { ...ins, status } : ins));
  };

  const filtered = insurers.filter(ins =>
    ins.name?.toLowerCase().includes(search.toLowerCase()) || ins.country?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <PageHeader title="Insurer Partners" subtitle="Underwriting partners and their policy portfolios"
        actions={<Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Add Insurer</Button>}
      />
      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 bg-input border-border text-foreground h-9" placeholder="Search insurers…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-card border border-border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No insurer partners yet</p>
          <Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-2 mt-4"><Plus className="w-4 h-4" /> Add Insurer</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(ins => (
            <div key={ins.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{ins.name}</h3>
                  <p className="text-xs text-muted-foreground">{ins.country} · {ins.regulatory_body || "—"}</p>
                </div>
                <StatusBadge status={ins.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Active Policies</p>
                  <p className="font-mono font-bold text-foreground mt-0.5">{ins.active_policies_count || 0}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Loss Ratio</p>
                  <p className={`font-mono font-bold mt-0.5 ${(ins.loss_ratio || 0) > 70 ? "text-red-400" : "text-green-400"}`}>{ins.loss_ratio || 0}%</p>
                </div>
              </div>
              {ins.license_number && (
                <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2 mb-3">
                  <code className="text-xs font-mono text-muted-foreground">{ins.license_number}</code>
                </div>
              )}
              {ins.supported_currencies?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {ins.supported_currencies.map(c => <span key={c} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-mono">{c}</span>)}
                </div>
              )}
              <div className="flex gap-2">
                {ins.status !== "active" && (
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-green-400/30 text-green-400 hover:bg-green-400/10" onClick={() => handleStatusChange(ins.id, "active")}>Activate</Button>
                )}
                {ins.status === "active" && (
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-border text-muted-foreground hover:bg-muted" onClick={() => handleStatusChange(ins.id, "inactive")}>Deactivate</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="text-foreground">Add Insurer Partner</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Insurer Name *</label>
                <Input className="bg-input border-border text-foreground" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="AXA, Zurich…" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Country *</label>
                <Input className="bg-input border-border text-foreground" value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} placeholder="US, UK, IN…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">License Number</label>
                <Input className="bg-input border-border text-foreground" value={form.license_number} onChange={e => setForm(f => ({...f, license_number: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Regulatory Body</label>
                <Input className="bg-input border-border text-foreground" value={form.regulatory_body} onChange={e => setForm(f => ({...f, regulatory_body: e.target.value}))} placeholder="FCA, IRDAI…" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Email</label>
              <Input className="bg-input border-border text-foreground" value={form.contact_email} onChange={e => setForm(f => ({...f, contact_email: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Supported Currencies (comma separated)</label>
              <Input className="bg-input border-border text-foreground" value={form.supported_currencies} onChange={e => setForm(f => ({...f, supported_currencies: e.target.value}))} placeholder="USD, EUR, INR…" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Supported Verticals (comma separated)</label>
              <Input className="bg-input border-border text-foreground" value={form.supported_verticals} onChange={e => setForm(f => ({...f, supported_verticals: e.target.value}))} placeholder="gig_economy, ecommerce…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.name || !form.country || saving}>
              {saving ? "Adding…" : "Add Insurer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
