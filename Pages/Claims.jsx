import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle, Plus, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";

const STATUS_FLOW = ["submitted", "under_review", "approved", "paid", "rejected"];

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [form, setForm] = useState({ policy_id: "", claimant_email: "", claimant_name: "", incident_date: "", incident_description: "", claim_amount: "", currency: "USD" });

  useEffect(() => {
    Promise.all([base44.entities.Claim.list("-created_date"), base44.entities.Policy.list()])
      .then(([c, p]) => { setClaims(c); setPolicies(p); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const created = await base44.entities.Claim.create({ ...form, claim_amount: parseFloat(form.claim_amount), status: "submitted" });
    setClaims(prev => [created, ...prev]);
    setOpen(false);
    setSaving(false);
  };

  const handleAiTriage = async (claim) => {
    setTriaging(claim.id);
    const policy = policies.find(p => p.id === claim.policy_id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI claims triage engine. Analyze this insurance claim.

Claim Description: ${claim.incident_description}
Claim Amount: $${claim.claim_amount}
Policy Type: ${policy?.coverage_type || "unknown"}
Policy Coverage: $${policy?.coverage_amount || "unknown"}
Incident Date: ${claim.incident_date}

Return JSON with:
- severity: "low" | "medium" | "high" | "critical"
- triage_summary: 2-sentence assessment
- recommended_status: "approved" | "under_review" | "rejected"`,
      response_json_schema: {
        type: "object",
        properties: {
          severity: { type: "string" },
          triage_summary: { type: "string" },
          recommended_status: { type: "string" }
        }
      }
    });

    await base44.entities.Claim.update(claim.id, { ai_severity: result.severity, ai_triage_summary: result.triage_summary, status: result.recommended_status || "under_review" });
    setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, ai_severity: result.severity, ai_triage_summary: result.triage_summary, status: result.recommended_status || "under_review" } : c));
    setTriaging(false);
    if (selected?.id === claim.id) setSelected(prev => ({ ...prev, ai_severity: result.severity, ai_triage_summary: result.triage_summary, status: result.recommended_status || "under_review" }));
  };

  const handleStatusChange = async (claim, status) => {
    await base44.entities.Claim.update(claim.id, { status, resolved_at: ["approved","paid","rejected"].includes(status) ? new Date().toISOString() : undefined });
    setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status } : c));
    if (selected?.id === claim.id) setSelected(prev => ({ ...prev, status }));
  };

  const filtered = claims.filter(c => {
    const matchSearch = [c.claimant_email, c.claimant_name, c.policy_number].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6">
      <PageHeader title="Claims" subtitle="AI-triaged insurance claims management"
        actions={<Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> File Claim</Button>}
      />
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-input border-border text-foreground h-9" placeholder="Search claims…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="bg-input border-border text-foreground h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            {["all","submitted","under_review","approved","rejected","paid"].map(s => (
              <SelectItem key={s} value={s} className="text-foreground capitalize">{s === "all" ? "All Status" : s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
              <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-foreground font-medium">No claims found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(claim => (
                <div key={claim.id} onClick={() => setSelected(claim)}
                  className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/30 ${selected?.id === claim.id ? "border-primary/40 glow-blue" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{claim.claimant_name || claim.claimant_email}</p>
                        {claim.ai_severity && <StatusBadge status={claim.ai_severity} />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{claim.incident_description}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">{claim.incident_date ? format(new Date(claim.incident_date), "MMM d, yyyy") : ""}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge status={claim.status} />
                      <span className="font-mono text-sm font-bold text-foreground">${(claim.claim_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          {!selected ? (
            <div className="text-center py-12">
              <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Select a claim to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{selected.claimant_name || selected.claimant_email}</h3>
                <p className="text-xs text-muted-foreground">{selected.claimant_email}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-mono font-bold text-foreground mt-0.5">${(selected.claim_amount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-0.5"><StatusBadge status={selected.status} /></div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Incident Description</p>
                <p className="text-xs text-foreground bg-muted/30 rounded-lg p-3">{selected.incident_description}</p>
              </div>
              {selected.ai_triage_summary ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs font-medium text-primary">AI Triage</p>
                    {selected.ai_severity && <StatusBadge status={selected.ai_severity} />}
                  </div>
                  <p className="text-xs text-muted-foreground">{selected.ai_triage_summary}</p>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-2" onClick={() => handleAiTriage(selected)} disabled={triaging === selected.id}>
                  {triaging === selected.id ? (<><div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Triaging…</>) : (<><Sparkles className="w-3.5 h-3.5" /> Run AI Triage</>)}
                </Button>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Update Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FLOW.filter(s => s !== selected.status).map(s => (
                    <button key={s} onClick={() => handleStatusChange(selected, s)} className="px-2 py-1 text-xs bg-muted/40 hover:bg-muted border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors capitalize">
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="text-foreground">File New Claim</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Claimant Email *</label>
                <Input className="bg-input border-border text-foreground" value={form.claimant_email} onChange={e => setForm(f => ({...f, claimant_email: e.target.value}))} placeholder="user@example.com" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Claimant Name</label>
                <Input className="bg-input border-border text-foreground" value={form.claimant_name} onChange={e => setForm(f => ({...f, claimant_name: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Policy</label>
              <Select value={form.policy_id} onValueChange={v => setForm(f => ({...f, policy_id: v}))}>
                <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm"><SelectValue placeholder="Select policy" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {policies.map(p => <SelectItem key={p.id} value={p.id} className="text-foreground text-xs">{p.policy_number || p.id.slice(0,8)} — {p.policy_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Incident Date</label>
              <Input type="date" className="bg-input border-border text-foreground" value={form.incident_date} onChange={e => setForm(f => ({...f, incident_date: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Incident Description *</label>
              <Textarea rows={3} className="bg-input border-border text-foreground resize-none" value={form.incident_description} onChange={e => setForm(f => ({...f, incident_description: e.target.value}))} placeholder="Describe what happened in detail…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Claim Amount *</label>
                <Input type="number" className="bg-input border-border text-foreground" value={form.claim_amount} onChange={e => setForm(f => ({...f, claim_amount: e.target.value}))} />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.claimant_email || !form.incident_description || !form.claim_amount || saving}>
              {saving ? "Filing…" : "File Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
