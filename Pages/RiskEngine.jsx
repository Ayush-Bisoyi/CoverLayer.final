import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Play, Clock, Shield, TrendingUp, TrendingDown, Minus, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { format } from "date-fns";

const EVENT_TYPES = ["gig_job_accepted", "ecommerce_checkout", "flight_booking", "loan_disbursement", "rental_listing", "freelance_contract", "cargo_shipment"];

const defaultForm = {
  event_type: "gig_job_accepted",
  user_context: "25-year-old gig worker, 3 months on platform, 4.8 star rating, accepting a delivery job worth $45 in urban area",
  transaction_value: 45,
  location: "New York, US"
};

function getRiskColor(score) {
  if (!score && score !== 0) return "text-muted-foreground";
  if (score < 30) return "text-green-400";
  if (score < 60) return "text-yellow-400";
  if (score < 80) return "text-orange-400";
  return "text-red-400";
}

function getRiskBarColor(score) {
  if (score < 30) return "bg-green-400";
  if (score < 60) return "bg-yellow-400";
  if (score < 80) return "bg-orange-400";
  return "bg-red-400";
}

function FactorTag({ factor, direction }) {
  const isUp = direction === "increase";
  const Icon = isUp ? TrendingUp : direction === "decrease" ? TrendingDown : Minus;
  const cls = isUp
    ? "bg-red-400/10 border-red-400/20 text-red-400"
    : direction === "decrease"
    ? "bg-green-400/10 border-green-400/20 text-green-400"
    : "bg-muted/40 border-border text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border font-medium ${cls}`}>
      <Icon className="w-3 h-3" />{factor}
    </span>
  );
}

async function runAssessment(form) {
  const startMs = Date.now();
  const llmResult = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AI insurance risk assessment engine.

Event Type: ${form.event_type}
User Context: ${form.user_context}
Transaction Value: $${form.transaction_value}
Location: ${form.location}

Return JSON with:
- risk_score: 0-100 integer
- risk_summary: 2-sentence plain language summary
- recommended_policies: array of 2-3 objects with { coverage_type, policy_name, estimated_premium_usd, coverage_amount_usd, rationale }
- risk_increasing_factors: array of 2-4 short phrases that INCREASED risk
- risk_decreasing_factors: array of 2-4 short phrases that DECREASED risk
- primary_risk_factors: array of 3 main risk factors`,
    response_json_schema: {
      type: "object",
      properties: {
        risk_score: { type: "number" },
        risk_summary: { type: "string" },
        recommended_policies: { type: "array", items: { type: "object", properties: { coverage_type: { type: "string" }, policy_name: { type: "string" }, estimated_premium_usd: { type: "number" }, coverage_amount_usd: { type: "number" }, rationale: { type: "string" } } } },
        risk_increasing_factors: { type: "array", items: { type: "string" } },
        risk_decreasing_factors: { type: "array", items: { type: "string" } },
        primary_risk_factors: { type: "array", items: { type: "string" } }
      }
    }
  });
  return { ...llmResult, processingMs: Date.now() - startMs };
}

export default function RiskEngine() {
  const [riskEvents, setRiskEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [whatIfForm, setWhatIfForm] = useState(defaultForm);
  const [whatIfRunning, setWhatIfRunning] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState(null);

  useEffect(() => {
    base44.entities.RiskEvent.list("-created_date", 15).then(re => { setRiskEvents(re); setLoading(false); });
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    const llmResult = await runAssessment(form);
    const savedEvent = await base44.entities.RiskEvent.create({
      partner_id: "demo", event_type: form.event_type, user_context: form.user_context,
      transaction_value: form.transaction_value, location: form.location,
      risk_score: llmResult.risk_score, matched_policies: llmResult.recommended_policies?.length || 0, processing_ms: llmResult.processingMs
    });
    setRiskEvents(prev => [savedEvent, ...prev.slice(0, 14)]);
    setResult(llmResult);
    setRunning(false);
  };

  const handleWhatIf = async () => {
    setWhatIfRunning(true);
    setWhatIfResult(null);
    const llmResult = await runAssessment(whatIfForm);
    setWhatIfResult(llmResult);
    setWhatIfRunning(false);
  };

  const scoreDelta = result && whatIfResult ? whatIfResult.risk_score - result.risk_score : null;

  const ResultPanel = ({ res, running: isRunning }) => (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Assessment Result</h3>
        {res && <span className="ml-auto font-mono text-xs text-green-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {res.processingMs}ms</span>}
      </div>
      {!res && !isRunning && (
        <div className="text-center py-12">
          <Zap className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Run an assessment to see AI risk scoring</p>
        </div>
      )}
      {isRunning && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />)}</div>}
      {res && !isRunning && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
              <p className={`text-3xl font-bold font-mono ${getRiskColor(res.risk_score)}`}>{res.risk_score}</p>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${getRiskBarColor(res.risk_score)}`} style={{ width: `${res.risk_score}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{res.risk_summary}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {res.risk_increasing_factors?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-400 mb-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Increasing Risk</p>
                <div className="flex flex-col gap-1">{res.risk_increasing_factors.map((f, i) => <FactorTag key={i} factor={f} direction="increase" />)}</div>
              </div>
            )}
            {res.risk_decreasing_factors?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-400 mb-1.5 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Reducing Risk</p>
                <div className="flex flex-col gap-1">{res.risk_decreasing_factors.map((f, i) => <FactorTag key={i} factor={f} direction="decrease" />)}</div>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Matched Policies ({res.recommended_policies?.length})</p>
            <div className="space-y-2">
              {res.recommended_policies?.map((pol, i) => (
                <div key={i} className="p-3 bg-muted/20 border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{pol.policy_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pol.rationale}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono text-primary font-bold">${pol.estimated_premium_usd}</p>
                      <p className="text-xs text-muted-foreground">${(pol.coverage_amount_usd / 1000).toFixed(0)}K coverage</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const FormPanel = ({ f, setF, onRun, isRunning, label }) => (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
        <Select value={f.event_type} onValueChange={v => setF(prev => ({...prev, event_type: v}))}>
          <SelectTrigger className="bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            {EVENT_TYPES.map(v => <SelectItem key={v} value={v} className="text-foreground font-mono text-xs">{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">User & Transaction Context</label>
        <Textarea rows={4} className="bg-input border-border text-foreground text-sm resize-none" value={f.user_context} onChange={e => setF(prev => ({...prev, user_context: e.target.value}))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Transaction Value ($)</label>
          <Input type="number" className="bg-input border-border text-foreground" value={f.transaction_value} onChange={e => setF(prev => ({...prev, transaction_value: parseFloat(e.target.value)}))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Location</label>
          <Input className="bg-input border-border text-foreground" value={f.location} onChange={e => setF(prev => ({...prev, location: e.target.value}))} />
        </div>
      </div>
      <Button onClick={onRun} disabled={isRunning} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
        {isRunning ? (<><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Running…</>) : (<><Play className="w-4 h-4" /> Run Assessment</>)}
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Risk Engine" subtitle="AI-powered contextual risk scoring and policy matching" />
      <Tabs defaultValue="assess">
        <TabsList className="bg-muted/40 border border-border">
          <TabsTrigger value="assess" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Risk Assessment
          </TabsTrigger>
          <TabsTrigger value="whatif" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
            <FlaskConical className="w-3.5 h-3.5 mr-1.5" /> What-If Mode
          </TabsTrigger>
          <TabsTrigger value="log" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Assessment Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assess" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <FormPanel f={form} setF={setForm} onRun={handleRun} isRunning={running} label="Event Context" />
            <ResultPanel res={result} running={running} />
          </div>
        </TabsContent>

        <TabsContent value="whatif" className="mt-4">
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-primary font-medium">💡 Tweak any field and see how the risk score changes vs your baseline assessment.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <FormPanel f={whatIfForm} setF={setWhatIfForm} onRun={handleWhatIf} isRunning={whatIfRunning} label="Modified Scenario" />
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Score Comparison</h3>
              {!whatIfResult && !whatIfRunning ? (
                <div className="text-center py-12"><FlaskConical className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Run a what-if scenario to compare</p></div>
              ) : whatIfRunning ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />)}</div>
              ) : (
                <div className="space-y-4">
                  {scoreDelta !== null && (
                    <div className={`p-3 rounded-lg border text-center ${scoreDelta > 0 ? "bg-red-400/10 border-red-400/20" : scoreDelta < 0 ? "bg-green-400/10 border-green-400/20" : "bg-muted/30 border-border"}`}>
                      <p className="text-xs text-muted-foreground mb-1">Risk Score Change</p>
                      <p className={`text-2xl font-bold font-mono ${scoreDelta > 0 ? "text-red-400" : scoreDelta < 0 ? "text-green-400" : "text-muted-foreground"}`}>{scoreDelta > 0 ? "+" : ""}{scoreDelta}</p>
                      <p className="text-xs text-muted-foreground mt-1">{result ? `Baseline: ${result.risk_score}` : "No baseline"} → What-if: {whatIfResult.risk_score}</p>
                    </div>
                  )}
                  {result && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Baseline</span><span className={`font-mono font-bold ${getRiskColor(result.risk_score)}`}>{result.risk_score}</span></div>
                        <div className="h-2 bg-muted rounded-full"><div className={`h-full rounded-full ${getRiskBarColor(result.risk_score)}`} style={{ width: `${result.risk_score}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">What-if</span><span className={`font-mono font-bold ${getRiskColor(whatIfResult.risk_score)}`}>{whatIfResult.risk_score}</span></div>
                        <div className="h-2 bg-muted rounded-full"><div className={`h-full rounded-full ${getRiskBarColor(whatIfResult.risk_score)}`} style={{ width: `${whatIfResult.risk_score}%` }} /></div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-foreground bg-muted/30 rounded-lg p-3">{whatIfResult.risk_summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {whatIfResult.risk_increasing_factors?.slice(0,3).map((f, i) => <FactorTag key={i} factor={f} direction="increase" />)}
                    {whatIfResult.risk_decreasing_factors?.slice(0,3).map((f, i) => <FactorTag key={`d${i}`} factor={f} direction="decrease" />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Assessment History</h3>
            {loading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted/40 rounded-lg animate-pulse" />)}</div>
            ) : riskEvents.length === 0 ? (
              <div className="text-center py-12"><Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" /><p className="text-sm font-medium text-foreground">No assessments yet</p><p className="text-xs text-muted-foreground mt-1">Run your first risk assessment to start tracking</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="pb-2 text-xs font-medium text-muted-foreground">Timestamp</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground">Event Type</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground">Location</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground">Risk Score</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground">Matched</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {riskEvents.map(event => (
                      <tr key={event.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 font-mono text-xs text-muted-foreground">{event.created_date ? format(new Date(event.created_date), "MMM d, HH:mm") : "—"}</td>
                        <td className="py-2.5 font-mono text-xs text-muted-foreground">{event.event_type}</td>
                        <td className="py-2.5 text-xs text-foreground">{event.location || "—"}</td>
                        <td className="py-2.5"><span className={`font-mono text-sm font-bold ${getRiskColor(event.risk_score)}`}>{event.risk_score || "—"}</span></td>
                        <td className="py-2.5 text-xs text-foreground">{event.matched_policies || 0} policies</td>
                        <td className="py-2.5 font-mono text-xs text-muted-foreground">{event.processing_ms ? `${event.processing_ms}ms` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
