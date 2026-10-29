import { Copy, Check, Plus, ArrowDown } from "lucide-react";
import { useChatLauncher } from "../hooks/useChatLauncher";
import { CAMPUS_RPCA_GUIDE } from "../constants/campusRpcaGuide";
import { useState, useRef, useEffect, useCallback } from "react";
import { AxiosError } from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { ChatMessage, PlotType } from "../types/api";
import { sendChatMessage } from "../services/api";
import type { DashboardFormPatch } from "../types/formAutomation";
import {
  createFormPatchFromChat,
  describeFormPatch,
} from "../utils/chatFormPatches";

type UiMessage = ChatMessage & { id: string };

interface ChatbotWidgetProps {
  selectedPlotType: PlotType;
  onApplyFormPatch?: (patch: DashboardFormPatch) => void;
}

/** Markdown tuned for assistant bubbles on a light/neutral background. */
const assistantMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed text-gray-700 dark:text-gray-200">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-white">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-600 dark:text-gray-300">{children}</em>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 text-[0.85em] font-mono text-gray-800 dark:text-gray-100"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 max-w-full overflow-x-auto rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-xs leading-relaxed text-gray-800 dark:text-gray-100">
      {children}
    </pre>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1.5 pl-5 text-sm text-gray-700 dark:text-gray-200">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1.5 pl-5 text-sm text-gray-700 dark:text-gray-200">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="break-all text-[#ba0c2f] dark:text-red-300 underline underline-offset-2 hover:text-[#9a0a26] dark:hover:text-red-200"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => (
    <h1 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-3 first:mt-0 text-sm font-semibold text-gray-900 dark:text-white">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2 text-sm font-medium text-gray-800 dark:text-gray-100">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[#ba0c2f]/40 pl-3 text-sm italic text-gray-600 dark:text-gray-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-gray-200 dark:border-gray-600" />,
  table: ({ children }) => (
    <div className="my-2 max-w-full overflow-x-auto">
      <table className="w-full min-w-[200px] border-collapse border border-gray-200 dark:border-gray-600 text-xs">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-100 dark:bg-gray-900">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-left font-medium text-gray-900 dark:text-gray-100">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-200">
      {children}
    </td>
  ),
};

const MAX_TEXTAREA_ROWS = 10;

const SUGGESTED_PROMPTS = [
  "How many meters are in the dataset?",
  "Set up Campus RPCA for the demo",
  "Were there campus overage events at 22,000 kW?",
  "Did Arts & Journalism cause the August overage?",
  "Is Foundational Science Building usage increasing?",
] as const;

const WELCOME_MESSAGE = `Hi! I'm the **Energy Assistant** — I answer questions about Ball State energy data using live meter tools.

**What I can do**
- Find meters and dataset date ranges
- Summarize usage and trend direction
- Analyze campus overage events and contributors
- Explain seasonal and temperature patterns
- Flag suspicious spikes (I'll ask before removing any)

**Tip:** Use the dashboard tabs for charts and PNG plots. I'll focus on clear summaries here.`;

function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
      aria-live="polite"
      aria-label="Assistant is thinking"
    >
      <span className="inline-flex gap-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-3 py-2 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 motion-safe:animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 motion-safe:animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 motion-safe:animate-bounce [animation-delay:300ms]" />
      </span>
      <span>Thinking…</span>
    </div>
  );
}

export default function ChatbotWidget({
  selectedPlotType,
  onApplyFormPatch,
}: ChatbotWidgetProps) {
  const launcher = useChatLauncher();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const followLatest = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME_MESSAGE,
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposedPatch, setProposedPatch] =
    useState<DashboardFormPatch | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUserMessages = messages.some((m) => m.role === "user");

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const padding =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const border =
      parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const maxHeight = lineHeight * MAX_TEXTAREA_ROWS + padding + border;
    const next = Math.min(el.scrollHeight + border, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    adjustTextareaHeight();
  }, [input, isOpen, isExpanded, adjustTextareaHeight]);

  useEffect(() => {
    if (!isOpen) return;
    if (!followLatest.current) { setShowLatest(true); return; }
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "instant",
    });
  }, [messages, isOpen, isSending, error]);

  useEffect(() => {
    if (!isOpen) return;
    textareaRef.current?.focus();
    const resize = new ResizeObserver(adjustTextareaHeight);
    if (textareaRef.current) resize.observe(textareaRef.current);
    return () => resize.disconnect();
  }, [isOpen, adjustTextareaHeight]);

  const copyMessage = async (message: UiMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setCopyNotice("Answer copied.");
    } catch { setCopyNotice("Could not copy. Select the answer text and copy it manually."); }
  };

  const handleSend = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isSending) return;

    followLatest.current = true;
    setShowLatest(false);
    const userMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const patch = onApplyFormPatch
      ? createFormPatchFromChat(trimmed, selectedPlotType)
      : null;

    if (patch) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: patch.targetPlotType === "rpca-analysis"
            ? "I’ve prepared the settings below. Click **Apply settings**, check the dates and meters in the **Campus overview** panel, then click **Generate**. You’ll get three charts: unusual energy use, actual use compared with usual use, and campus total use compared with your limit. You’ll also see how many hours were above the limit."
            : "I can update the dashboard form for that. Review the settings card and apply it when you're ready.",
        },
      ]);
      setProposedPatch(patch);
      setInput("");
      setError(null);
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setIsSending(true);

    const history: ChatMessage[] = [...messages, userMsg].map(
      ({ role, content }) => ({ role, content }),
    );

    try {
      const res = await sendChatMessage({
        messages: history,
        session_id: sessionId,
      });
      if (res.session_id) setSessionId(res.session_id);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: res.message.role,
          content: res.message.content,
        },
      ]);
    } catch (e) {
      const msg =
        e instanceof AxiosError
          ? String(e.response?.data?.detail ?? e.message)
          : e instanceof Error
            ? e.message
            : "Request failed";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const handleApplyPatch = () => {
    if (!proposedPatch || !onApplyFormPatch) return;
    onApplyFormPatch(proposedPatch);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: proposedPatch.targetPlotType === "rpca-analysis"
          ? "Your settings are ready in the **Campus overview** panel. Check the dates and meters, then click **Generate** in that panel to see the three charts and the number of hours above your limit. The analysis has not started yet. Long date ranges can take several minutes."
          : "Applied those settings to the dashboard form. Check any dataset-specific meter choices before generating the analysis.",
      },
    ]);
    setProposedPatch(null);
  };

  const panelWidth = isExpanded
    ? "fixed inset-0 z-[60]"
    : "fixed bottom-24 right-6 z-50 w-[min(100%,480px)] max-w-[calc(100vw-1.5rem)] h-[min(720px,calc(100dvh-6rem))]";

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-label="Energy Assistant"
          onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); handleClose(); } }}
          className={`${panelWidth} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors ${
            isExpanded ? "rounded-none border-0" : ""
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Energy Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Meters, usage, overage & trends
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" disabled={isSending} aria-label="Start a new chat" title="New chat" className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40" onClick={() => {
                setMessages([{ id: "welcome", role: "assistant", content: WELCOME_MESSAGE }]);
                setSessionId(undefined); setProposedPatch(null); setError(null); setInput(""); setCopiedId(null); setCopyNotice("");
                followLatest.current = true; setShowLatest(false); textareaRef.current?.focus();
              }}><Plus size={18} /></button>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={
                  isExpanded ? "Exit full screen" : "Expand to full screen"
                }
              >
                {isExpanded ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close chat window"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={(event) => {
              const el = event.currentTarget;
              followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              if (followLatest.current) setShowLatest(false);
            }}
            className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-800 overscroll-contain transition-colors"
          >
            <div
              className={`p-5 space-y-6 ${isExpanded ? "max-w-3xl mx-auto w-full" : ""}`}
            >
              <details className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                <summary className="cursor-pointer font-semibold">Campus overview guide</summary>
                <div className="mt-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={assistantMarkdownComponents}>
                    {CAMPUS_RPCA_GUIDE}
                  </ReactMarkdown>
                </div>
              </details>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <span
                    className={`text-xs font-medium px-1 ${
                      m.role === "user"
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-[#ba0c2f]/80 dark:text-red-300/80"
                    }`}
                  >
                    {m.role === "user" ? "You" : "Assistant"}
                  </span>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[min(92%,36rem)] rounded-2xl rounded-tr-md px-4 py-2.5 text-sm leading-relaxed bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 whitespace-pre-wrap wrap-break-word"
                        : "w-full min-w-0 text-sm leading-7 text-gray-800 dark:text-gray-100 wrap-break-word"
                    }
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={assistantMarkdownComponents}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  {m.role === "assistant" && m.id !== "welcome" && (
                    <button type="button" onClick={() => void copyMessage(m)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="Copy answer">
                      {copiedId === m.id ? <Check size={14} /> : <Copy size={14} />}{copiedId === m.id ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              ))}

              {!hasUserMessages && !isSending && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                    Try a question
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setInput(prompt)}
                        className="text-left text-xs leading-snug px-3 py-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-[#ba0c2f]/50 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSending && <TypingIndicator />}

              {proposedPatch && (
                <div className="rounded-xl border border-[#0079A7]/25 bg-white p-3 shadow-sm dark:border-[#AEDBE9]/30 dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#0079A7] dark:text-[#AEDBE9]">
                        Dashboard settings
                      </p>
                      <h4 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {proposedPatch.summary}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProposedPatch(null)}
                      className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    >
                      Dismiss
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                    {describeFormPatch(proposedPatch).map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0079A7] dark:bg-[#AEDBE9]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {proposedPatch.notes?.length ? (
                    <div className="mt-3 rounded-lg bg-[#AEDBE9]/20 px-3 py-2 text-xs text-gray-700 dark:bg-[#0079A7]/20 dark:text-gray-200">
                      {proposedPatch.notes[0]}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleApplyPatch}
                    className="mt-3 w-full rounded-lg bg-[#0079A7] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00668d]"
                  >
                    Apply settings
                  </button>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200"
                >
                  <p className="font-medium mb-0.5">Something went wrong</p>
                  <p className="text-xs leading-relaxed opacity-90">{error}</p>
                </div>
              )}
            </div>
          </div>

          <span role="status" className="sr-only">{copyNotice}</span>
          {showLatest && <button type="button" className="mx-auto my-2 inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 dark:border-gray-600" onClick={() => {
            followLatest.current = true; setShowLatest(false);
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
          }}><ArrowDown size={14} />Latest message</button>}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 transition-colors">
            <div
              className={`flex gap-2 items-end ${isExpanded ? "max-w-3xl mx-auto w-full" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  placeholder="Ask about meters, usage, or overage…"
                  value={input}
                  rows={1}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  disabled={isSending}
                  aria-label="Message"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-60 resize-none leading-5 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#ba0c2f]/30 focus:border-[#ba0c2f]/50"
                />
                <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 px-1">
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isSending || !input.trim()}
                className="shrink-0 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#ba0c2f] text-white hover:bg-[#9a0a26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {(!isOpen || !isExpanded) && (
        <button
          type="button"
          ref={launcherRef}
          style={{ left: launcher.position.x, top: launcher.position.y, touchAction: "none" }}
          onPointerDown={launcher.onPointerDown}
          onPointerMove={launcher.onPointerMove}
          onPointerUp={launcher.onPointerUp}
          onPointerCancel={launcher.onPointerCancel}
          onLostPointerCapture={launcher.onPointerUp}
          onKeyDown={(event) => {
            const offsets: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
            if (offsets[event.key]) { event.preventDefault(); launcher.move(...offsets[event.key]); }
          }}
          onClick={(event) => {
            if (event.detail !== 0 && launcher.moved.current) { launcher.moved.current = false; return; }
            followLatest.current = true; setIsOpen((prev) => !prev);
          }}
          title="Click to open or close chat. Drag to move, or use arrow keys when focused."
          aria-expanded={isOpen}
          className="fixed cursor-grab active:cursor-grabbing select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ba0c2f] z-[70] w-14 h-14 rounded-full bg-[#ba0c2f] hover:bg-[#9a0a26] text-white shadow-lg flex items-center justify-center transition-colors"
          aria-label={isOpen ? "Hide chatbot" : "Open chatbot"}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h8m-8 4h5m8-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      )}
    </>
  );
}
