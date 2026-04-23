export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value.toLocaleString()}</strong>
    </article>
  );
}
