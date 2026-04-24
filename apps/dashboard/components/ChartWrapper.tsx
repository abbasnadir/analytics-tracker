"use client";

import React from "react";
import { ApiError } from "@/services/api";

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: ApiError | null;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode; // optional toolbar slot
}

/**
 * ChartWrapper
 * ------------
 * Generic container for all chart components.
 * Handles: title, loading skeleton, error states, and optional action slot.
 * Chart-type agnostic — works with Line, Bar, Pie, or any future chart.
 */
export default function ChartWrapper({
  title,
  subtitle,
  isLoading,
  error,
  children,
  className = "",
  action,
}: ChartWrapperProps) {
  return (
    <div className={`chart-wrapper ${className}`} role="figure" aria-label={title}>
      <div className="chart-wrapper__header">
        <div>
          <h3 className="chart-wrapper__title">{title}</h3>
          {subtitle && (
            <p className="chart-wrapper__subtitle">{subtitle}</p>
          )}
        </div>
        {action && <div className="chart-wrapper__action">{action}</div>}
      </div>

      <div className="chart-wrapper__body">
        {isLoading && (
          <div className="chart-wrapper__skeleton" aria-busy="true">
            <div className="chart-skeleton">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="chart-skeleton__bar"
                  style={{ height: `${30 + Math.sin(i * 1.2) * 25 + 40}%`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="chart-wrapper__error" role="alert">
            <span className="chart-wrapper__error-icon">⚠</span>
            <p className="chart-wrapper__error-message">
              {error.message || "Failed to load data"}
            </p>
            <p className="chart-wrapper__error-code">
              {error.status && `HTTP ${error.status}`}
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="chart-wrapper__content">{children}</div>
        )}
      </div>
    </div>
  );
}
