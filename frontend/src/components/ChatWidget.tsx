import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, AlertCircle, Maximize2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ChatService } from "@/services/api";
import { Lock } from "lucide-react";

/* Simple markdown to JSX renderer */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0];
    const dataRows = tableRows.filter((r, i) => i > 0 && !r.every((c) => /^[-:| ]+$/.test(c)));
    elements.push(
      <div key={`tbl-${elements.length}`} className="overflow-x-auto my-2">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-stone-300">
              {headers.map((h, j) => (
                <th key={j} className="text-left px-2 py-1 font-bold text-stone-800">{formatInline(h.trim())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} className="border-b border-stone-200 hover:bg-stone-100">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1 text-stone-500">{formatInline(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      inTable = true;
      const cells = line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
      continue;
    }
    if (inTable) { flushTable(); inTable = false; }
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1 ? "text-sm font-bold mt-2 mb-1" : level === 2 ? "text-xs font-bold mt-1.5 mb-0.5" : "text-[11px] font-semibold mt-1";
      elements.push(<p key={i} className={cls}>{formatInline(headingMatch[2])}</p>);
      continue;
    }
    if (line.trim() === "") { elements.push(<br key={i} />); continue; }
    elements.push(<p key={i} className="mb-0.5">{formatInline(line)}</p>);
  }
  if (inTable) flushTable();
  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={match.index} className="font-bold text-stone-900">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index}>{match[3]}</em>);
    else if (match[4]) parts.push(<code key={match.index} className="bg-stone-100 px-1 py-0.5 rounded text-[10px] font-mono">{match[4]}</code>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

const CHAT_SESSION_KEY = "chatWidgetMessages";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const ChatWidget = () => {
  const { user } = useAuth();
  const { isPremium, aiMessageCount, triggerPaymentFlow, updateAiMessageCount } = useSubscription();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hi! Ask me anything about your JEE rank and college options." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const counselling = "JOSAA";
  const [examMode, setExamMode] = useState("JEE Main");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (messages.length > 1) sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { const t = setTimeout(() => setPulse(false), 5000); return () => clearTimeout(t); }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (!isPremium && aiMessageCount >= 3) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: trimmed }]);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "⚠️ **LIMIT REACHED:** You have used all 3 free AI requests.\n\nPlease upgrade to **Premium** to ask unlimited questions." }]);
      setInput("");
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); setLoading(true); setError(null);
    try {
      const data = await ChatService.sendMessage(trimmed, counselling, examMode, undefined, user?.id);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.answer || "Error" }]);
      await updateAiMessageCount();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI service unavailable.");
    } finally { setLoading(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  if (!user) return null;
  if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup") return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl shadow-stone-300/40 flex flex-col border border-stone-200 bg-stone-100"
          style={{ maxHeight: "480px", animation: "slide-up 0.25s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-gradient-to-r from-violet-600 to-orange-600">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-stone-900" />
              <div>
                <p className="text-white font-bold text-sm">AI Counsellor</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-white/70 text-xs">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/ai-counsellor" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-stone-900" title="Open full chat">
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-stone-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "300px" }}>
            <div className="mb-4">
              <div className="flex items-center bg-white p-1 rounded-xl border border-stone-200">
                {["JEE Main", "JEE Advanced"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setExamMode(mode)}
                    className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg transition-all ${examMode === mode ? "bg-violet-600 text-white shadow-sm" : "text-stone-500 hover:text-stone-900"}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${msg.role === "assistant" ? "bg-gradient-to-br from-violet-600 to-orange-600" : "bg-stone-100"}`}>
                  {msg.role === "assistant" ? <Bot className="w-3 h-3 text-stone-900" /> : <span className="text-stone-600 font-bold">U</span>}
                </div>
                <div className={`max-w-[85%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${msg.role === "assistant" ? "bg-white border border-stone-200 text-stone-600 rounded-tl-none" : "bg-gradient-to-r from-violet-600 to-orange-600 text-white rounded-tr-none"}`}>
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-stone-900" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none px-3 py-2 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                  <span className="text-xs text-stone-500">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-1.5 items-start p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500">{error}</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-stone-200 flex-shrink-0 p-3">
             {!isPremium && aiMessageCount >= 3 ? (
                <div className="w-full flex justify-between items-center bg-[#f0ece4] border border-stone-300 rounded-xl p-2 px-3">
                   <div className="flex items-center gap-2">
                     <Lock className="w-4 h-4 text-stone-500" />
                     <span className="text-xs text-stone-600 font-medium">Limit reached.</span>
                   </div>
                   <button onClick={triggerPaymentFlow} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] transition-colors">
                     Unlock
                   </button>
                </div>
             ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={`Ask AI... (${!isPremium ? 3 - aiMessageCount + " left" : "Premium"})`}
                    className="flex-1 text-xs rounded-xl px-3 py-2 outline-none bg-white border border-stone-200 text-stone-900 focus:ring-1 focus:ring-violet-500/50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-orange-600"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 text-stone-900 animate-spin" /> : <Send className="w-3.5 h-3.5 text-stone-900" />}
                  </button>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div className="relative group">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-orange-600 flex items-center justify-center shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-violet-500/30 ${pulse ? "animate-pulse-glow" : ""}`}
          title="Chat with AI Counsellor"
        >
          {open ? <X className="w-6 h-6 text-stone-900" /> : <Bot className="w-6 h-6 text-stone-900" />}
        </button>
        {!open && (
          <div className="absolute bottom-full right-0 mb-2 bg-white border border-stone-200 text-xs font-semibold text-stone-600 px-3 py-1.5 rounded-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
            Ask AI Counsellor
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
