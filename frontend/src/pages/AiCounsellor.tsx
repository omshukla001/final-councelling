import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, AlertCircle, RotateCcw, GraduationCap, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChatService } from "@/services/api";
import { AtmosphericGlow, FadeIn } from "@/components/ui/LayoutAtoms";
import { Lock } from "lucide-react";
import DOMPurify from "dompurify";

interface ChartDataPoint { name: string; closing_rank: number; }
interface Message { id: string; role: "user" | "assistant"; content: string; latency?: number; options?: string[]; chartData?: ChartDataPoint[]; }

const INITIAL_OPTIONS = ["Predict My College", "Compare Branches", "Previous Year Cutoffs"];
const COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#10b981'];

const AiCounsellor = () => {
  const loadInitialMessages = (): Message[] => {
    try {
      const raw = sessionStorage.getItem("chatWidgetMessages");
      if (raw) {
        const widgetMessages = JSON.parse(raw) as { id: string; role: "user" | "assistant"; content: string }[];
        if (widgetMessages.length > 1) {
          sessionStorage.removeItem("chatWidgetMessages");
          const converted: Message[] = widgetMessages.map((m) => ({ id: m.id, role: m.role, content: m.content }));
          converted.push({ id: "expanded", role: "assistant", content: "📌 **SYSTEM TRANSFERRED.** Session expanded to full terminal. Waiting for instructions.", options: INITIAL_OPTIONS });
          return converted;
        }
      }
    } catch { }
    return [{ id: "welcome", role: "assistant", content: "INITIALIZING AI COUNSELLOR PROTOCOL...\n\nPlease configure your **Rank and Category** below. I can calculate probability matrices for institute allocations and generate branch cutoffs.", options: INITIAL_OPTIONS }];
  };

  const [messages, setMessages] = useState<Message[]>(loadInitialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { prefs } = useUserPreferences();
  const { user } = useAuth();
  const { isPremium, aiMessageCount, triggerPaymentFlow, updateAiMessageCount } = useSubscription();
  const counselling = "JOSAA";
  const [examMode, setExamMode] = useState(prefs.examType || "JEE Main");
  const [rank, setRank] = useState<number>(prefs.rank ? parseInt(prefs.rank) || 15000 : 15000);
  const [category, setCategory] = useState(prefs.category || "OPEN");
  const [quota, setQuota] = useState(prefs.quotas?.[0] || "OS");
  const [showControls, setShowControls] = useState(true);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, loading]);

  const sendMessage = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    if (!isPremium && aiMessageCount >= 3) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: trimmed }]);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "⚠️ **LIMIT REACHED:** You have used all 3 free AI requests.\n\nPlease upgrade to **Premium** to ask unlimited questions, unlock the advanced placement matrices, and download custom counselor sheets." }]);
      return;
    }

    let contextQuestion = trimmed;
    if (!/\d/.test(contextQuestion)) contextQuestion = `${trimmed}. My rank is ${rank} in ${category} category (${quota} quota).`;

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: trimmed }]);
    setInput(""); setLoading(true); setError(null);

    try {
      const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await ChatService.sendMessage(contextQuestion, counselling, examMode, chatHistory, user?.id);

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: data.answer || "Failed to parse AI response.", latency: data.latency_ms, options: data.options || [] };
      try {
           const parsedContent = JSON.parse(data.answer);
           if (parsedContent.friendly_response) aiMsg.content = parsedContent.friendly_response;
           if (parsedContent.chart_data?.length) aiMsg.chartData = parsedContent.chart_data;
           if (parsedContent.magic_chips?.length) aiMsg.options = parsedContent.magic_chips;
      } catch (e) { }
      
      setMessages((prev) => [...prev, aiMsg]);
      await updateAiMessageCount();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to connect to AI service."); } 
    finally { setLoading(false); }
  };

  const clearChat = () => { setMessages([{ id: "welcome-reset", role: "assistant", content: "MEMORY PURGED. Awaiting new query parameters.", options: INITIAL_OPTIONS }]); setError(null); };

  const formatMessage = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) { tableLines.push(lines[i].trim()); i++; }
        if (tableLines.length >= 2) {
          const headerCells = tableLines[0].split("|").filter((c) => c.trim() !== "").map((c) => c.trim());
          const startRow = tableLines[1].replace(/[|\s\-:]/g, "") === "" ? 2 : 1;
          const dataRows = tableLines.slice(startRow).map((row) => row.split("|").filter((c) => c.trim() !== "").map((c) => c.trim()));
          elements.push(
            <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-stone-200 bg-stone-100">
              <table className="w-full text-[10px] uppercase font-bold tracking-widest text-left">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-500">
                    {headerCells.map((cell, ci) => <th key={ci} className="px-4 py-3 whitespace-nowrap">{cell}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dataRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-stone-100 transition-colors">
                      {row.map((cell, ci) => {
                        let cellClass = "px-4 py-3 whitespace-nowrap text-stone-900 font-mono";
                        const lower = cell.toLowerCase();
                        if (lower === "safe") cellClass += " text-emerald-400";
                        else if (lower === "moderate") cellClass += " text-amber-400";
                        else if (lower === "dream") cellClass += " text-orange-500";
                        return <td key={ci} className={cellClass} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cell.replace(/\*\*(.*?)\*\*/g, "<span class='text-orange-400'>$1</span>")) }} />;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      const formatted = DOMPurify.sanitize(line.replace(/\*\*(.*?)\*\*/g, "<span class='text-orange-400'>$1</span>").replace(/\*(.*?)\*/g, "<em>$1</em>"));
      if (line.startsWith("### ")) elements.push(<p key={`h3-${i}`} className="font-bold text-xs uppercase tracking-widest mt-4 mb-2 text-stone-400" dangerouslySetInnerHTML={{ __html: formatted.slice(4) }} />);
      else if (line.startsWith("## ")) elements.push(<p key={`h2-${i}`} className="font-bold text-sm uppercase tracking-widest mt-4 mb-2 text-stone-900" dangerouslySetInnerHTML={{ __html: formatted.slice(3) }} />);
      else if (line.startsWith("# ")) elements.push(<p key={`h1-${i}`} className="font-black text-lg uppercase tracking-tight mt-4 mb-2 text-orange-400" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />);
      else elements.push(<p key={`p-${i}`} className={`text-sm leading-relaxed ${line === "" ? "mt-2" : ""}`} dangerouslySetInnerHTML={{ __html: formatted }} />);
      i++;
    }
    return elements;
  };

  return (
    <div className="h-screen text-stone-900 flex flex-col overflow-hidden">
      <AtmosphericGlow />

      {/* Hero Banner Header — dark warm overlay, no white fog */}
      <div className="shrink-0 relative pt-24 pb-14 px-4 mb-0 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,18,10,0.65) 0%, rgba(28,18,10,0.50) 50%, rgba(28,18,10,0.35) 100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/15 via-transparent to-orange-900/10" />
        <div className="container mx-auto max-w-7xl relative z-10 flex flex-col gap-4">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 mb-2">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">AI Counsellor</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none text-white">
                    AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">Counsellor</span>
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                      <span className="text-xs font-semibold text-emerald-400">Online</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-white/80">Powered by AI</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-white/80">JoSAA Expert</span>
                  </div>
                </div>
              </div>
            </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowControls(!showControls)} className="px-4 h-9 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-white/80 hover:bg-white/20 transition-all flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" /> {showControls ? "Hide" : "Settings"}
            </button>
            <button onClick={clearChat} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 border border-white/15 text-white/70 hover:text-red-400 hover:bg-red-500/15 transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Compact Config Bar */}
      {showControls && (
        <div className="shrink-0 border-b border-stone-200 bg-stone-100 px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3 w-full max-w-[280px]">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest shrink-0">RANK</label>
              <Slider value={[rank]} min={1} max={100000} step={10} onValueChange={(v) => setRank(v[0])} className="flex-1 [&>span:first-child]:bg-stone-200 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-400 [&>span:nth-child(2)]:bg-orange-500" />
              <span className="text-xs font-mono font-bold text-stone-700 w-14 text-right">{rank}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">CAT</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-24 h-8 bg-stone-100 border-stone-200 text-[10px] font-mono focus:ring-orange-500"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-stone-200 text-stone-900"><SelectItem value="OPEN">OPEN</SelectItem><SelectItem value="OBC-NCL">OBC-NCL</SelectItem><SelectItem value="EWS">EWS</SelectItem><SelectItem value="SC">SC</SelectItem><SelectItem value="ST">ST</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">EXAM</label>
              <Select value={examMode} onValueChange={setExamMode}>
                <SelectTrigger className="w-28 h-8 bg-stone-100 border-stone-200 text-[10px] font-mono focus:ring-orange-500"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-stone-200 text-stone-900"><SelectItem value="JEE Main">JEE MAIN</SelectItem><SelectItem value="JEE Advanced">JEE ADV</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">QUOTA</label>
              <Select value={quota} onValueChange={setQuota}>
                <SelectTrigger className="w-16 h-8 bg-stone-100 border-stone-200 text-[10px] font-mono focus:ring-orange-500"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-stone-200 text-stone-900"><SelectItem value="AI">AI</SelectItem><SelectItem value="OS">OS</SelectItem><SelectItem value="HS">HS</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages - takes all remaining space */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 ${msg.role === "assistant" ? "bg-gradient-to-br from-violet-500 to-orange-600 text-white" : "bg-stone-200 text-stone-500"}`}>
                {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${msg.role === "assistant" ? "bg-stone-50 border border-stone-200 rounded-tl-sm" : "bg-orange-500 text-white rounded-tr-sm"}`}>
                <div className={`space-y-1.5 ${msg.role === "assistant" ? "text-stone-700" : "text-white"}`}>{formatMessage(msg.content)}</div>
                
                {msg.chartData && msg.chartData.length > 0 && (
                    <div className="mt-6 mb-2 rounded-xl border border-stone-200 bg-stone-100 p-4 h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={msg.chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                             <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#78716c', fontWeight: 'bold' }} />
                             <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#888', fontWeight: 'bold' }} />
                             <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #333", borderRadius: "8px", fontSize: "10px", textTransform: "uppercase", fontWeight: "bold" }} cursor={{ fill: 'rgba(255,255,255,0.05)' }}/>
                             <Bar dataKey="closing_rank" radius={[0, 4, 4, 0]} barSize={20}>
                                {msg.chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                )}

                {msg.latency !== undefined && <p className="text-[10px] opacity-30 mt-3 text-right font-mono uppercase tracking-widest">{msg.latency.toFixed(0)}MS RT</p>}
                
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-stone-200">
                    {msg.options.map((opt, i) => (
                      <button key={i} onClick={() => sendMessage(opt)} disabled={loading} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 hover:bg-white hover:text-black transition-all disabled:opacity-50">
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-orange-600 text-white flex items-center justify-center mt-1"><Bot className="w-4 h-4" /></div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                <span className="text-sm font-medium text-stone-500 animate-pulse">Thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-3 items-start p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs ml-11">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div><p className="font-bold text-red-500 uppercase tracking-widest mb-1">Connection Error</p><p className="text-red-500">{error}</p></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Bar - sticky bottom */}
      <div className="shrink-0 p-4 sm:px-8 border-t border-stone-200">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          {!isPremium && aiMessageCount >= 3 ? (
             <div className="w-full flex flex-col items-center justify-center p-4 bg-[#f0ece4] border border-stone-300 rounded-xl">
                <Lock className="w-6 h-6 text-stone-500 mb-2" />
                <p className="text-sm text-stone-600 font-medium mb-3">You've reached your free limit.</p>
                <button onClick={triggerPaymentFlow} className="w-full sm:w-auto px-6 h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-colors">
                  Unlock Premium for ₹99
                </button>
             </div>
          ) : (
             <>
                <Textarea
                  ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder={`Ask about colleges... (${!isPremium ? 3 - aiMessageCount + " free hits left" : "Unlimited Access"})`}
                  className="flex-1 resize-none min-h-[52px] max-h-[140px] bg-white border border-stone-200 text-sm text-stone-900 rounded-xl focus:ring-orange-500/50 py-4 px-5 placeholder:text-stone-400"
                  rows={1}
                />
                <button
                  onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="w-[52px] h-[52px] bg-gradient-to-br from-violet-500 to-orange-600 text-white font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCounsellor;
