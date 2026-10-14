"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TransactionInput } from "@/lib/schemas";
import { formatDate, formatMoney, todayISO, TYPE_LABEL } from "@/lib/format";
import Logo from "@/components/Logo";

type Message = {
  role: "user" | "assistant";
  content: string;
  proposal?: TransactionInput | null;
  status?: "pending" | "saved" | "cancelled";
};

const GREETING: Message = {
  role: "assistant",
  content:
    '¡Hola! Soy Vuelto 👋 Contame qué gastaste o cobraste y lo anoto, o preguntame por tus números. Por ejemplo: "gasté 3500 en el súper ayer" o "¿cuánto gasté en supermercado este mes?".',
};

export default function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          today: todayISO(),
          messages: next
            .filter((m) => m !== GREETING)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const body = await res.json();
      setMessages((m) => [
        ...m,
        res.ok
          ? {
              role: "assistant",
              content: body.reply,
              proposal: body.proposal,
              status: body.proposal ? "pending" : undefined,
            }
          : { role: "assistant", content: `⚠️ ${body.error ?? "Error"}` },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ Error de conexión" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function setStatus(index: number, status: Message["status"]) {
    setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, status } : msg)));
  }

  async function confirmProposal(index: number, proposal: TransactionInput) {
    setStatus(index, "saved");
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposal),
    });
    if (!res.ok) {
      setStatus(index, "pending");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ No pude guardar el registro." },
      ]);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="chat-launcher press fixed right-4 bottom-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand-950 text-brand-50 shadow-lg shadow-brand-950/20 dark:bg-brand-300 dark:text-brand-950"
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={open}
      >
        <svg data-shown={!open} className="chat-icon col-start-1 row-start-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />
        </svg>
        <svg data-shown={open} className="chat-icon col-start-1 row-start-1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <div
        data-open={open}
        inert={!open}
        className="chat-panel fixed right-4 bottom-22 z-50 flex h-[min(560px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Logo size={32} />
          <div>
            <p className="font-display text-base font-semibold leading-tight">Vuelto</p>
            <p className="text-xs text-zinc-500">Tu asistente de bolsillo</p>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`appear flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "rounded-br-md bg-brand-950 text-brand-50 dark:bg-brand-300 dark:text-brand-950"
                    : "rounded-bl-md bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {m.content}
              </p>
              {m.proposal && (
                <ProposalCard
                  proposal={m.proposal}
                  status={m.status}
                  onConfirm={() => confirmProposal(i, m.proposal!)}
                  onCancel={() => setStatus(i, "cancelled")}
                />
              )}
            </div>
          ))}
          {loading && (
            <div className="appear flex w-fit gap-1 rounded-2xl rounded-bl-md bg-zinc-100 px-3 py-3 dark:bg-zinc-800" role="status" aria-label="Pensando">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-500" style={{ "--i": dot } as React.CSSProperties} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={send}
          className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: ¿en qué gasté más este mes?"
            className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 dark:border-zinc-700 dark:focus:border-brand-300"
          />
          <button
            disabled={loading || !input.trim()}
            className="press rounded-lg bg-brand-950 px-3 text-sm font-medium text-brand-50 disabled:opacity-40 dark:bg-brand-300 dark:text-brand-950"
          >
            Enviar
          </button>
        </form>
      </div>
    </>
  );
}

function ProposalCard({
  proposal,
  status,
  onConfirm,
  onCancel,
}: {
  proposal: TransactionInput;
  status?: Message["status"];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const income = proposal.type === "income";
  return (
    <div className="w-[85%] rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-700">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`text-xs font-medium uppercase ${income ? "text-emerald-600" : "text-rose-600"}`}
        >
          {TYPE_LABEL[proposal.type]}
        </span>
        <span className="font-semibold tabular-nums">
          {formatMoney(proposal.amount)}
        </span>
      </div>
      <p className="mt-1">{proposal.category}</p>
      <p className="text-xs text-zinc-500">
        {formatDate(proposal.date)}
        {proposal.description ? ` · ${proposal.description}` : ""}
      </p>
      {status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onConfirm}
            className="press flex-1 rounded-lg bg-brand-950 py-1.5 text-xs font-medium text-brand-50 dark:bg-brand-300 dark:text-brand-950"
          >
            Confirmar
          </button>
          <button
            onClick={onCancel}
            className="press flex-1 rounded-lg border border-zinc-300 py-1.5 text-xs dark:border-zinc-700"
          >
            Cancelar
          </button>
        </div>
      )}
      {status === "saved" && <p className="pop mt-2 origin-left text-xs font-medium text-emerald-600">✓ Anotado</p>}
      {status === "cancelled" && <p className="appear mt-2 text-xs text-zinc-500">Cancelado. Quedó como estaba.</p>}
    </div>
  );
}
