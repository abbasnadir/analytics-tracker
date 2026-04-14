import { MetricCard } from "../components/metric-card";
import { getOverview } from "../lib/api";

export default async function DashboardPage() {
  const overview = await getOverview();

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MetricFlow</p>
          <h1>Event analytics, split clean across SDK, API, analyzer, dashboard.</h1>
          <p className="subtle">
            This starter dashboard reads backend metrics only. Raw events stay behind API boundary.
          </p>
        </div>
        <div className="hero-meta">
          <span>Tenant</span>
          <strong>{overview.tenantId}</strong>
          <span>Generated</span>
          <strong>{new Date(overview.generatedAt).toLocaleString()}</strong>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Page Views" value={overview.totalPageViews} />
        <MetricCard label="Clicks" value={overview.totalClicks} />
        <MetricCard label="Top Pages" value={overview.topPages.length} />
        <MetricCard label="Top Elements" value={overview.topElements.length} />
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Top Pages</h2>
          <table>
            <thead>
              <tr>
                <th>Page</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {overview.topPages.map((item) => (
                <tr key={item.key}>
                  <td>{item.key}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <h2>Top Elements</h2>
          <table>
            <thead>
              <tr>
                <th>Element</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {overview.topElements.map((item) => (
                <tr key={item.key}>
                  <td>{item.key}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}
