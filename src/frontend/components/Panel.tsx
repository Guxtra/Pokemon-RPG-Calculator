import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  tag?: string;
  children: ReactNode;
}

export function Panel({ title, tag, children }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel-header">
        <h2 className="panel-title">{title}</h2>
        {tag && <span className="panel-tag">{tag}</span>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
