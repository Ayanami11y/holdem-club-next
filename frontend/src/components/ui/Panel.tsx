export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ padding: 24 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}
