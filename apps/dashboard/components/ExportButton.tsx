"use client";

import React from "react";

interface ExportButtonProps {
  data: any[];
  filename?: string;
  className?: string;
}

/**
 * ExportButton
 * ------------
 * A reusable button that accepts an array of objects and downloads them as a CSV file.
 */
export default function ExportButton({ data, filename = "export.csv", className = "" }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Extract headers from the first object
    const headers = Object.keys(data[0]);

    // Build CSV string
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            let value = row[fieldName];
            // Escape quotes and wrap strings in quotes if they contain commas
            if (typeof value === "string") {
              value = `"${value.replace(/"/g, '""')}"`;
            } else if (value === null || value === undefined) {
              value = "";
            }
            return value;
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className={`export-btn ${className}`}
      aria-label="Export data to CSV"
      title="Export to CSV"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: "6px" }}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export CSV
    </button>
  );
}
