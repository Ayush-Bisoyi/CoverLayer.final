import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/PageHeader";

const SUGGESTED = [
  "What policies are currently active?",
  "Summarize open claims and their severity",
  "Which insurers have the best loss ratios?",
  "What's the risk profile for gig economy events?",
  "Show me policies expiring soon",
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "flex flex-col items-end" : ""}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 ${isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
            {isUser ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:leading-relaxed [&_ul]:my-1 [&_li]:my-0.5">
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {message.tool_calls.map((tc, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
                {tc.status === "running" || tc.status === "in_progress"
                  ? <div className="w-3 h-3 border border-muted-foreground/40 border-t-primary rounded-full animate-spin" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                <span className="font-mono">{tc.name?.split(".").reverse().join(" ") || "tool"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrokerAssistant() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    base44.agents.listConversations({ agent_name: "broker_assistant" }).then(convs => {
      setConversations(convs || []);
      setLoadingConvs(false);
    });
    return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const subscribeToConversation = (convId) => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      setMessages(data.messages || []);
    });
  };

  const startNewConversation = async () => {
    const conv = await base44.agents.createConversation({ agent_name: "broker_assistant", metadata: { name: `Chat ${new Date().toLocaleTimeString()}` } });
    setConversations(prev => [conv, ...prev]);
    setActiveConv(conv);
    setMessages([]);
    subscribeToConversation(conv.id);
  };

  const openConversation = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConv(full);
    setMessages(full.messages || []);
    subscribeToConversation(full.id);
  };

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({ agent_name: "broker_assistant", metadata: { name: content.slice(0, 40) } });
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);
      subscribeToConversation(conv.id);
    }
    await base44.agents.addMessage(conv, { role: "user", content });
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Button onClick={startNewConversation} size="sm" className="w-full bg-primary text-primary-foreground gap-2">
            <Plus className="w-3.5 h-3.5" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            <div className="space-y-2 p-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted/40 rounded-lg animate-pulse" />)}</div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No chats yet</p>
          ) : conversations.map(conv => (
            <button key={conv.id} onClick={() => openConversation(conv)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate ${activeConv?.id === conv.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}>
              <MessageSquare className="w-3 h-3 inline mr-1.5 opacity-60" />
              {conv.metadata?.name || "Conversation"}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Broker Assistant</p>
            <p className="text-xs text-muted-foreground">Policies · Claims · Insurer Appetite · Risk</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!activeConv ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">AI Broker Assistant</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Ask anything about your policies, claims, insurer appetite, or risk profiles.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {SUGGESTED.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    className="text-left px-4 py-2.5 bg-card border border-border rounded-xl text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-sm text-muted-foreground">Start by asking a question below</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTED.slice(0,3).map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">{q}</button>
                ))}
              </div>
            </div>
          ) : messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
          <div ref__={bottomRef} />
        </div>

        <div className="p-4 border-t border-border">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input className="flex-1 bg-input border-border text-foreground" placeholder="Ask about policies, claims, insurer appetite…" value={input} onChange={e => setInput(e.target.value)} disabled={sending} />
            <Button type="submit" disabled={!input.trim() || sending} size="icon" className="bg-primary text-primary-foreground">
              {sending ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
