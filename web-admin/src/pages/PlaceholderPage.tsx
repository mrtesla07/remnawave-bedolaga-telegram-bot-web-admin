interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-outline/40 bg-surface/60 p-10 text-center shadow-card">
      <p className="text-xs uppercase tracking-[0.28em] text-textMuted/70">раздел в разработке</p>
      <h1 className="gradient-title text-3xl font-semibold">{title}</h1>
      <p className="text-sm text-textMuted">
        {description ?? "Интерфейс раздела находится в разработке. Воспользуйтесь API согласно документации web-admin-integration.md."}
      </p>
    </div>
  );
}


