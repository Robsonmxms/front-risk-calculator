import { ReactNode } from "react";

type StateTone = "loading" | "empty" | "error" | "partial" | "stale" | "neutral";

const toneLabel: Record<StateTone, string> = {
  loading: "Carregando",
  empty: "Sem dados",
  error: "Falha",
  partial: "Parcial",
  stale: "Defasado",
  neutral: "Estado"
};

export function StatePanel({
  tone = "neutral",
  title,
  description,
  action
}: {
  tone?: StateTone;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className={`state-panel state-panel--${tone}`}>
      <p className="eyebrow">{toneLabel[tone]}</p>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {action ? <div className="state-panel__action">{action}</div> : null}
    </section>
  );
}
