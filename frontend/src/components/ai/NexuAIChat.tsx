"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Bot, Sparkles, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

const FREE_LIMIT = 3;
const PRO_URL = "https://yusuf545.gumroad.com/l/ttazrg";

const QUICK_PROMPTS = [
  "Summarize my revenue trends",
  "What's my biggest growth lever?",
  "How's my churn trending?",
];

const SAMPLE_RESPONSES: Record<string, string> = {
  default: "I can see your dashboard metrics. Based on the data, your MRR has grown steadily over the last 30 days. To get deeper AI analysis — anomaly detection, what-if scenarios, and benchmarks — upgrade to NexusAI Pro.",
  "revenue": "Your revenue summary shows positive momentum. MRR growth is tracking above baseline. For a full AI breakdown including forecasting and expansion opportunities, upgrade to Pro.",
  "churn": "Churn analysis requires your live subscription data. In Pro, I can flag at-risk customers, run cohort analysis, and suggest retention actions based on your actual data.",
  "growth": "Growth metrics look stable. The biggest lever depends on your CAC vs LTV ratio. Upgrade to Pro for a full AI-powered growth playbook tailored to your numbers.",
};

function getResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("revenue") || lower.includes("mrr")) return SAMPLE_RESPONSES.revenue;
  if (lower.includes("churn")) return SAMPLE_RESPONSES.churn;
  if (lower.includes("growth")) return SAMPLE_RESPONSES.growth;
  return SAMPLE_RESPONSES.default;
}

export function NexuAIChat() {
  const { chatOpen, setChatOpen } = useUIStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant" as const,
      content: `Hi${user?.full_name ? ` ${user.full_name.split(" ")[0]}` : ""}! I'm NEXU AI. You have ${FREE_LIMIT} free questions. Ask me anything about your metrics. 🚀`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isLocked = questionCount >= FREE_LIMIT;

  useEffect(() => { if (chatOpen) inputRef.current?.focus(); }, [chatOpen]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || isLoading || isLocked) return;

    setInput("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content }]);
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 900));

    const newCount = questionCount + 1;
    setQuestionCount(newCount);

    const reply = newCount >= FREE_LIMIT
      ? `You've used all ${FREE_LIMIT} free AI questions. Upgrade to Pro for unlimited conversations with full context of your live data.`
      : getResponse(content);

    setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: reply }]);
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setChatOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">NEXU AI</span>
                <span className="text-xs text-muted-foreground">
                  ({Math.max(0, FREE_LIMIT - questionCount)} questions left)
                </span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-accent text-foreground rounded-bl-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-accent rounded-2xl rounded-bl-sm px-3 py-2">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Lock gate */}
            {isLocked && (
              <div className="px-4 py-3 border-t border-border bg-primary/5">
                <p className="text-xs text-muted-foreground mb-2">You&apos;ve reached the free limit.</p>
                <a href={PRO_URL} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Lock className="w-3.5 h-3.5" /> Upgrade to Pro — Unlimited AI
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Quick prompts */}
            {!isLocked && messages.length <= 2 && (
              <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            {!isLocked && (
              <div className="px-4 pb-4 pt-2 border-t border-border flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Ask about your metrics..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary max-h-24"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
