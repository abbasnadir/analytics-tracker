"use client";

import { ApiFilters } from "@/services/api";
import FilterBar from "@/components/FilterBar";

interface DashboardFiltersPanelProps {
  title: string;
  subtitle: string;
  onFiltersChange: (filters: ApiFilters) => void;
  isLoading?: boolean;
}

export default function DashboardFiltersPanel({
  title,
  subtitle,
  onFiltersChange,
  isLoading,
}: DashboardFiltersPanelProps) {
  return (
    <section className="dashboard__filters" aria-label="Filters">
      <div className="dashboard__filters-card">
        <div className="dashboard__filters-meta">
          <div>
            <p className="dashboard__filters-eyebrow">Live Query</p>
            <h2 className="dashboard__filters-title">{title}</h2>
          </div>
          <p className="dashboard__filters-copy">{subtitle}</p>
        </div>

        <FilterBar onFiltersChange={onFiltersChange} isLoading={isLoading} />
      </div>
    </section>
  );
}
