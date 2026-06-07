import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Building2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

const VERTICALS = ["gig_economy", "ecommerce", "fintech", "travel", "marketplace", "healthtech", "other"];
const INTEGRATION_TYPES = ["api", "sdk", "widget", "no_code"];

function generateApiKey() {
  return "cl_live_" + Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("");
}

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company_name: "", email: "", contact_name: "", country: "", industry_vertical: "fintech", integration_type: "api", revenue_share_pct: 15 });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    base44.entities.Partner.list("-created_date").then(data => { setPartners(data); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const newPartner = await base44.entities.Partner.create({ ...form, api_key: generateApiKey(), status: "pending" });
    setPartners(prev => [newPartner, ...prev]);
    setOpen(false);
    setForm({ company_name: "", email: "", contact_name: "", country: "", industry_vertical: "fintech", integration_type: "api", revenue_share_pct: 15 });
    setSaving(false);
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.Partner.update(id, { status });
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const copyApiKey = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Platform Partners"
        subtitle="Manage API integrations and partner revenue share"
        actions={
          <Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Add Partner
          </Button>
        }
      />

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No partners yet</p>
          <Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-2 mt-4">
            <Plus className="w-4 h-4" /> Add Partner
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {partners.map(partner => (
            <div key={partner.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{partner.company_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{partner.contact_name || partner.email}</p>
                </div>
                <StatusBadge status={partner.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Vertical</p>
                  <p className="text-foreground font-medium capitalize mt-0.5">{(partner.industry_vertical || "—").replace("_", " ")}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Rev Share</p>
                  <p className="text-foreground font-mono font-medium mt-0.5">{partner.revenue_share_pct}%</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Policies</p>
                  <p className="text-foreground font-mono font-medium mt-0.5">{partner.total_policies_issued || 0}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Premium Vol.</p>
                  <p className="text-foreground font-mono font-medium mt-0.5">${(partner.total_premium_volume || 0).toLocaleString()}</p>
                </div>
              </div>
              {partner.api_key && (
                <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2 mb-3">
                  <code className="text-xs font-mono text-muted-foreground flex-1 truncate">{partner.api_key}</code>
                  <button onClick={() => copyApiKey(partner.api_key, partner.id)} className="text-muted-foreground hover:text-primary transition-colors">
                    {copied === partner.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                {partner.status === "pending" && (
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-green-400/30 text-green-400 hover:bg-green-400/10" onClick={() => handleStatusChange(partner.id, "active")}>Activate</Button>
                )}
                {partner.status === "active" && (
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-red-400/30 text-red-400 hover:bg-red-400/10" onClick={() => handleStatusChange(partner.id, "suspended")}>Suspend</Button>
                )}
                {partner.status === "suspended" && (
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-green-400/30 text-green-400 hover:bg-green-400/10" onClick={() => handleStatusChange(partner.id, "active")}>Reactivate</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="text-foreground">Add Platform Partner</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Company Name *</label>
                <Input className="bg-input border-border text-foreground" placeholder="Acme Corp" value={form.company_name} onChange={e => setForm(f => ({...f, company_name: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Contact Name</label>
                <Input className="bg-input border-border text-foreground" placeholder="Jane Doe" value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
              <Input className="bg-input border-border text-foreground" placeholder="partner@company.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Industry Vertical</label>
                <Select value={form.industry_vertical} onValueChange={v => setForm(f => ({...f, industry_vertical: v}))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {VERTICALS.map(v => <SelectItem key={v} value={v} className="text-foreground capitalize">{v.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Integration Type</label>
                <Select value={form.integration_type} onValueChange={v => setForm(f => ({...f, integration_type: v}))}>
                  <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {INTEGRATION_TYPES.map(v => <SelectItem key={v} value={v} className="text-foreground uppercase">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Country</label>
                <Input className="bg-input border-border text-foreground" placeholder="US, IN, BR..." value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Revenue Share %</label>
                <Input type="number" className="bg-input border-border text-foreground" value={form.revenue_share_pct} onChange={e => setForm(f => ({...f, revenue_share_pct: parseFloat(e.target.value)}))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.company_name || !form.email || saving}>
              {saving ? "Creating…" : "Create Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
