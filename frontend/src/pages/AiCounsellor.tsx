import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Sparkles, AlertCircle, RotateCcw, Settings2,
  Target, GitCompareArrows, TrendingUp, BrainCircuit, Lock, Mic,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChatService } from "@/services/api";
import DOMPurify from "dompurify";

interface ChartDataPoint { name: string; closing_rank: number; }
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  latency?: number;
  options?: string[];
  chartData?: ChartDataPoint[];
  isWelcome?: boolean;
}

const INITIAL_OPTIONS = ["Predict My College", "Compare Branches", "Previous Year Cutoffs"];
const COLORS = ["#FF6B35", "#EC407A", "#7C3AED", "#10B981", "#F59E0B"];

// Rotating status lines during "thinking"
const THINKING_STATUSES = [
  "Analyzing 1.2 M JoSAA cutoffs…",
  "Ranking Safe / Target / Dream matches…",
  "Cross-checking 10 years of data…",
  "Personalising for your rank…",
];

// Quick-start tiles shown on first load
const QUICK_STARTS = [
  {
    title: "Predict My Colleges",
    subtitle: "Top matches for your rank",
    prompt: "Based on my rank and category, which colleges can I realistically get?",
    icon: Target,
    bg: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
    emoji: "🎯",
  },
  {
    title: "Compare Branches",
    subtitle: "CSE vs ECE vs Mech, etc.",
    prompt: "Compare CSE and ECE for my rank — placements, difficulty and future scope.",
    icon: GitCompareArrows,
    bg: "linear-gradient(135deg, #EC407A 0%, #F97316 100%)",
    emoji: "⚖️",
  },
  {
    title: "Ask About a College",
    subtitle: "Placements, fees, campus life",
    prompt: "Tell me everything about NIT Trichy CSE — placements, fees, and campus life.",
    icon: BrainCircuit,
    bg: "linear-gradient(135deg, #7C3AED 0%, #EC407A 100%)",
    emoji: "🏛️",
  },
  {
    title: "Cutoff Trends",
    subtitle: "How cutoffs moved over 10 years",
    prompt: "Show me how CSE cutoffs at top NITs have changed over the last 10 years.",
    icon: TrendingUp,
    bg: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
    emoji: "📈",
  },
];

const AiCounsellor = () => {
  const loadInitialMessages = (): Message[] => {
    try {
      const raw = sessionStorage.getItem("chatWidgetMessages");
      if (raw) {
        const widgetMessages = JSON.parse(raw) as { id: string; role: "user" | "assistant"; content: string }[];
        if (widgetMessages.length > 1) {
          sessionStorage.removeItem("chatWidgetMessages");
          const converted: Message[] = widgetMessages.map((m) => ({ id: m.id, role: m.role, content: m.content }));
          converted.push({
            id: "expanded",
            role: "assistant",
            content: "Picking up where we left off — what would you like to explore next?",
            options: INITIAL_OPTIONS,
          });
          return converted;
        }
      }
    } catch { /* noop */ }
    return [{
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your JEE Counsellor 🎓 — pick a starter below or just type your question.",
      isWelcome: true,
    }];
  };

  const [messages, setMessages] = useState<Message[]>(loadInitialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingIdx, setThinkingIdx] = useState(0);
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

  const freeLeft = Math.max(0, 3 - aiMessageCount);
  const freeBlocked = !isPremium && aiMessageCount >= 3;

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, loading]);

  // Rotate the "thinking" status every 1.4s while loading
  useEffect(() => {
    if (!loading) return;
    setThinkingIdx(0);
    const id = setInterval(() => setThinkingIdx((i) => (i + 1) % THINKING_STATUSES.length), 1400);
    return () => clearInterval(id);
  }, [loading]);

  const sendMessage = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    if (freeBlocked) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: trimmed }]);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "You've used all 3 free AI questions. Upgrade to **Premium** to get unlimited chat, unlock full predictions, and download JoSAA-ready sheets.",
      }]);
      return;
    }

    let contextQuestion = trimmed;
    if (!/\d/.test(contextQuestion)) contextQuestion = `${trimmed}. My rank is ${rank} in ${category} category (${quota} quota).`;

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: trimmed }]);
    setInput(""); setLoading(true); setError(null);

    try {
      const chatHistory = messages.filter((m) => !m.isWelcome).map((m) => ({ role: m.role, content: m.content }));
      const data = await ChatService.sendMessage(contextQuestion, counselling, examMode, chatHistory, user?.id);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "Sorry, I couldn't parse that. Want to try rephrasing?",
        latency: data.latency_ms,
        options: data.options || [],
      };
      try {
        const parsed = JSON.parse(data.answer);
        if (parsed.friendly_response) aiMsg.content = parsed.friendly_response;
        if (parsed.chart_data?.length) aiMsg.chartData = parsed.chart_data;
        if (parsed.magic_chips?.length) aiMsg.options = parsed.magic_chips;
      } catch { /* noop */ }

      setMessages((prev) => [...prev, aiMsg]);
      await updateAiMessageCount();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect to AI service.");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome-reset",
      role: "assistant",
      content: "Fresh start! Pick a starter below or ask anything 👇",
      isWelcome: true,
    }]);
    setError(null);
  };

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
            <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-stone-200" style={{ background: "#FFF9F3" }}>
                    {headerCells.map((cell, ci) => (
                      <th key={ci} className="px-4 py-3 whitespace-nowrap font-bold uppercase tracking-wider" style={{ color: "#6B6B6B", fontSize: 10 }}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {dataRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-orange-50/40 transition-colors">
                      {row.map((cell, ci) => {
                        const lower = cell.toLowerCase();
                        let style: React.CSSProperties = { color: "#1A1A1A" };
                        if (lower === "safe") style = { color: "#059669", fontWeight: 700 };
                        else if (lower === "moderate") style = { color: "#D97706", fontWeight: 700 };
                        else if (lower === "dream") style = { color: "#7C3AED", fontWeight: 700 };
                        return (
                          <td
                            key={ci}
                            className="px-4 py-3 whitespace-nowrap font-medium"
                            style={style}
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(cell.replace(/\*\*(.*?)\*\*/g, "<strong style=\"color:#FF6B35\">$1</strong>")),
                            }}
                          />
                        );
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

      const formatted = DOMPurify.sanitize(
        line
          .replace(/\*\*(.*?)\*\*/g, "<strong style=\"color:#FF6B35\">$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
      );
      if (line.startsWith("### ")) elements.push(<p key={`h3-${i}`} className="font-bold text-[11px] uppercase tracking-widest mt-4 mb-1.5" style={{ color: "#6B6B6B" }} dangerouslySetInnerHTML={{ __html: formatted.slice(4) }} />);
      else if (line.startsWith("## ")) elements.push(<p key={`h2-${i}`} className="font-bold text-sm mt-4 mb-2" style={{ color: "#1A1A1A" }} dangerouslySetInnerHTML={{ __html: formatted.slice(3) }} />);
      else if (line.startsWith("# ")) elements.push(<p key={`h1-${i}`} className="font-extrabold text-base mt-4 mb-2" style={{ color: "#FF6B35" }} dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />);
      else elements.push(<p key={`p-${i}`} className={`text-[14px] leading-relaxed ${line === "" ? "mt-2" : ""}`} dangerouslySetInnerHTML={{ __html: formatted }} />);
      i++;
    }
    return elements;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#FFF9F3", color: "#1A1A1A" }}>
      {/* ── Hero Banner — warm light gradient, matches landing ───────────────── */}
      <div
        className="shrink-0 relative pt-24 pb-10 px-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FFF9F3 0%, #FFE8D6 55%, #FFD4B5 100%)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <motion.div
          className="absolute -top-24 -left-16 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(255,107,53,0.20), transparent 70%)", filter: "blur(40px)" }}
          animate={{ x: [0, 20, -10, 0], y: [0, -12, 8, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-0 -right-16 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(236,64,122,0.16), transparent 70%)", filter: "blur(50px)" }}
          animate={{ x: [0, -18, 10, 0], y: [0, 14, -6, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="site-container relative z-10 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 bg-white"
                style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[12px] font-semibold" style={{ color: "#1A1A1A" }}>AI Counsellor is online</span>
              </div>
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)", boxShadow: "0 12px 28px rgba(255,107,53,0.35)" }}
                >
                  <Sparkles className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h1
                    className="font-extrabold tracking-tight leading-none"
                    style={{ color: "#1A1A1A", fontSize: "clamp(26px, 4vw, 40px)" }}
                  >
                    AI{" "}
                    <span
                      className="bg-clip-text text-transparent"
                      style={{ backgroundImage: "linear-gradient(90deg, #FF6B35 0%, #F7B267 50%, #EC407A 100%)" }}
                    >
                      Counsellor
                    </span>
                  </h1>
                  <p className="text-sm mt-2" style={{ color: "#4A4A4A" }}>
                    Your personal JoSAA mentor — crunching 1.2 M data points so you don't have to.
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                      style={{ background: "rgba(255,107,53,0.10)", color: "#C2410C", border: "1px solid rgba(255,107,53,0.2)" }}
                    >
                      Powered by AI
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                      style={{ background: "rgba(124,58,237,0.10)", color: "#6D28D9", border: "1px solid rgba(124,58,237,0.2)" }}
                    >
                      JoSAA Expert
                    </span>
                    {!isPremium && (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                        style={{ background: "rgba(16,185,129,0.10)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}
                      >
                        {freeLeft} of 3 free questions left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowControls(!showControls)}
                className="px-4 h-9 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", color: "#1A1A1A", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                <Settings2 className="w-3.5 h-3.5" /> {showControls ? "Hide settings" : "Settings"}
              </button>
              <button
                onClick={clearChat}
                title="Clear chat"
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", color: "#4A4A4A", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Compact Config Bar ────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {showControls && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 overflow-hidden"
            style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.05)" }}
          >
            <div className="px-4 sm:px-8 py-3">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-3 w-full max-w-[300px]">
                  <label className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#6B6B6B" }}>Rank</label>
                  <Slider
                    value={[rank]}
                    min={1}
                    max={100000}
                    step={10}
                    onValueChange={(v) => setRank(v[0])}
                    className="flex-1 [&>span:first-child]:bg-orange-100 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-400 [&>span:nth-child(2)]:bg-orange-500"
                  />
                  <span className="text-xs font-mono font-bold w-14 text-right" style={{ color: "#1A1A1A" }}>{rank}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#6B6B6B" }}>Cat</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-24 h-8 text-[10px] font-mono focus:ring-orange-500"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="OPEN">OPEN</SelectItem><SelectItem value="OBC-NCL">OBC-NCL</SelectItem><SelectItem value="EWS">EWS</SelectItem><SelectItem value="SC">SC</SelectItem><SelectItem value="ST">ST</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#6B6B6B" }}>Exam</label>
                  <Select value={examMode} onValueChange={setExamMode}>
                    <SelectTrigger className="w-28 h-8 text-[10px] font-mono focus:ring-orange-500"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="JEE Main">JEE Main</SelectItem><SelectItem value="JEE Advanced">JEE Advanced</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#6B6B6B" }}>Quota</label>
                  <Select value={quota} onValueChange={setQuota}>
                    <SelectTrigger className="w-16 h-8 text-[10px] font-mono focus:ring-orange-500"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="AI">AI</SelectItem><SelectItem value="OS">OS</SelectItem><SelectItem value="HS">HS</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => {
            const isFirstWelcome = msg.isWelcome && idx === 0;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-1"
                  style={
                    msg.role === "assistant"
                      ? { background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)", boxShadow: "0 4px 12px rgba(255,107,53,0.25)" }
                      : { background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }
                  }
                >
                  {msg.role === "assistant"
                    ? <Bot className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4" style={{ color: "#4A4A4A" }} />}
                </div>

                <div
                  className="max-w-[86%] px-5 py-4"
                  style={
                    msg.role === "assistant"
                      ? {
                          background: "#FFFFFF",
                          border: "1px solid rgba(0,0,0,0.06)",
                          borderRadius: 18,
                          borderTopLeftRadius: 4,
                          boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
                          color: "#1A1A1A",
                        }
                      : {
                          background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                          borderRadius: 18,
                          borderTopRightRadius: 4,
                          color: "#FFFFFF",
                          boxShadow: "0 6px 20px rgba(255,107,53,0.25)",
                        }
                  }
                >
                  <div className="space-y-1.5">{formatMessage(msg.content)}</div>

                  {/* Welcome empty-state → quick-start tiles */}
                  {isFirstWelcome && (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {QUICK_STARTS.map((qs, i) => {
                        const Icon = qs.icon;
                        return (
                          <motion.button
                            key={qs.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.08 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -3, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => sendMessage(qs.prompt)}
                            className="relative overflow-hidden text-left group"
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid rgba(0,0,0,0.06)",
                              borderRadius: 16,
                              padding: 14,
                              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: qs.bg, boxShadow: "0 6px 16px rgba(255,107,53,0.22)" }}
                              >
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[13px]" style={{ color: "#1A1A1A" }}>{qs.title}</span>
                                  <span className="text-[13px]">{qs.emoji}</span>
                                </div>
                                <p className="text-[11.5px] mt-0.5" style={{ color: "#6B6B6B" }}>{qs.subtitle}</p>
                              </div>
                            </div>
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                              style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.06), transparent 60%)" }}
                            />
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {msg.chartData && msg.chartData.length > 0 && (
                    <div
                      className="mt-5 mb-1 rounded-xl p-4 h-64 w-full"
                      style={{ background: "#FFF9F3", border: "1px solid rgba(0,0,0,0.05)" }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={msg.chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#6B6B6B", fontWeight: 600 }} />
                          <YAxis dataKey="name" type="category" width={120} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#4A4A4A", fontWeight: 600 }} />
                          <Tooltip
                            contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, fontSize: 11, fontWeight: 600 }}
                            cursor={{ fill: "rgba(255, 107, 53, 0.08)" }}
                          />
                          <Bar dataKey="closing_rank" radius={[0, 6, 6, 0]} barSize={20}>
                            {msg.chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {msg.latency !== undefined && (
                    <p
                      className="text-[10px] mt-3 text-right font-mono uppercase tracking-widest opacity-60"
                      style={{ color: msg.role === "user" ? "rgba(255,255,255,0.8)" : "#6B6B6B" }}
                    >
                      {msg.latency.toFixed(0)} ms
                    </p>
                  )}

                  {msg.options && msg.options.length > 0 && (
                    <div
                      className="flex flex-wrap gap-2 mt-4 pt-3"
                      style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                    >
                      {msg.options.map((opt, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => sendMessage(opt)}
                          disabled={loading}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid rgba(255,107,53,0.25)",
                            color: "#C2410C",
                            boxShadow: "0 2px 8px rgba(255,107,53,0.08)",
                          }}
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-1"
                  style={{ background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)", boxShadow: "0 4px 12px rgba(255,107,53,0.25)" }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div
                  className="px-5 py-4 flex items-center gap-3"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: 18,
                    borderTopLeftRadius: 4,
                    boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#FF6B35" }}
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={thinkingIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm font-medium"
                      style={{ color: "#4A4A4A" }}
                    >
                      {THINKING_STATUSES[thinkingIdx]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div
              className="flex gap-3 items-start p-4 rounded-xl text-xs ml-11"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
              <div>
                <p className="font-bold uppercase tracking-widest mb-1" style={{ color: "#DC2626" }}>Connection error</p>
                <p style={{ color: "#B91C1C" }}>{error}</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input Bar ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 p-4 sm:px-8"
        style={{ background: "#FFFFFF", borderTop: "1px solid rgba(0,0,0,0.05)" }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Free-quota progress bar (only for non-premium, not yet blocked) */}
          {!isPremium && !freeBlocked && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                <motion.div
                  initial={false}
                  animate={{ width: `${(freeLeft / 3) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #10B981 0%, #FF6B35 100%)" }}
                />
              </div>
              <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: "#6B6B6B" }}>
                {freeLeft} of 3 free left
              </span>
              <button
                onClick={triggerPaymentFlow}
                className="text-[11px] font-bold whitespace-nowrap transition-colors"
                style={{ color: "#FF6B35" }}
              >
                Go unlimited →
              </button>
            </div>
          )}

          <div className="flex gap-3 items-end">
            {freeBlocked ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #FFF9F3 0%, #FFE8D6 100%)",
                  border: "1px solid rgba(255,107,53,0.25)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)", boxShadow: "0 6px 16px rgba(255,107,53,0.3)" }}
                  >
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>Free limit reached</p>
                    <p className="text-xs mt-0.5" style={{ color: "#4A4A4A" }}>Get unlimited chat + full predictions for ₹99/month</p>
                  </div>
                </div>
                <button
                  onClick={triggerPaymentFlow}
                  className="w-full sm:w-auto px-5 h-10 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.03]"
                  style={{ background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)", boxShadow: "0 8px 20px rgba(255,107,53,0.3)" }}
                >
                  Unlock Premium for ₹99
                </button>
              </motion.div>
            ) : (
              <>
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                    }}
                    placeholder="Ask anything — rank, branches, colleges, cutoffs…"
                    className="resize-none min-h-[52px] max-h-[140px] rounded-2xl py-4 pl-5 pr-12 text-sm"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: "#1A1A1A",
                    }}
                    rows={1}
                  />
                  <button
                    type="button"
                    title="Voice input (coming soon)"
                    className="absolute right-3 bottom-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors opacity-60 hover:opacity-100"
                    style={{ color: "#6B6B6B" }}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                <motion.button
                  whileHover={!input.trim() || loading ? {} : { scale: 1.05 }}
                  whileTap={!input.trim() || loading ? {} : { scale: 0.96 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 20px rgba(255,107,53,0.3)",
                  }}
                  aria-label="Send message"
                >
                  {loading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkles className="w-5 h-5" /></motion.div>
                    : <Send className="w-5 h-5" />}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiCounsellor;
