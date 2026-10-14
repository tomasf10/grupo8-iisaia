"use client";

import { useSyncExternalStore } from "react";
import { formatMoney } from "@/lib/format";

const noop = () => () => {};

function greetingFor(hour: number | null) {
  if (hour === null) return "Hola";
  if (hour >= 5 && hour < 13) return "Buen día";
  if (hour >= 13 && hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

// La hora es la del navegador; en el servidor se muestra "Hola" hasta hidratar.
export function GreetingTitle() {
  const hour = useSyncExternalStore(noop, () => new Date().getHours(), () => null);
  return <>{greetingFor(hour)}</>;
}

export function BalanceLine({ balance }: { balance: number }) {
  if (balance > 0) {
    return <>Este mes te quedan <strong className="font-semibold text-brand-700 dark:text-brand-300">{formatMoney(balance)}</strong> de vuelto.</>;
  }
  if (balance < 0) {
    return <>Este mes vas <strong className="font-semibold text-rose-700 dark:text-rose-400">{formatMoney(-balance)}</strong> en rojo. Nada que no se arregle.</>;
  }
  return <>Arrancamos el mes en cero.</>;
}
