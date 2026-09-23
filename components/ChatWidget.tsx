"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TransactionInput } from "@/lib/schemas";
import { formatDate, formatMoney, todayISO, TYPE_LABEL } from "@/lib/format";

type Message = {
  role: "user" | "assistant";
  content: string;
  proposal?: TransactionInput | null;
  status?: "pending" | "saved" | "cancelled";
};

const GREETING: Message = {
  role: "assistant",
  content:
    'Hola 👋 Contame un gasto o ingreso y lo registro. Por ejemplo: "gasté 3500 en el súper ayer" o "cobré 250 mil de sueldo".',
};

export default function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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
        className="fixed right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl text-white shadow-lg transition hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900"
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div className="fixed right-4 bottom-22 z-50 flex h-[min(560px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold">Asistente</p>
            <p className="text-xs text-zinc-500">Registrá movimientos escribiendo</p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <p
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800"
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
            {loading && <p className="text-xs text-zinc-500">Pensando…</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={send}
            className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: pagué 12 mil de luz"
              className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
              autoFocus
            />
            <button
              disabled={loading || !input.trim()}
              className="rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
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
            className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Confirmar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-xs dark:border-zinc-700"
          >
            Cancelar
          </button>
        </div>
      )}
      {status === "saved" && <p className="mt-2 text-xs text-emerald-600">✓ Registrado</p>}
      {status === "cancelled" && <p className="mt-2 text-xs text-zinc-500">Cancelado</p>}
    </div>
  );
}
