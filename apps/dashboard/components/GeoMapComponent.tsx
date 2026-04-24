"use client";

import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { GeoDataPoint } from "@/services/api";
import { formatNumber } from "@/utils/formatters";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeoMapComponentProps {
  data: GeoDataPoint[];
}

/**
 * GeoMapComponent
 * ---------------
 * Renders a Choropleth map displaying user geographic distribution.
 * Uses react-simple-maps with a standard topojson world map.
 */
export default function GeoMapComponent({ data }: GeoMapComponentProps) {
  const maxVal = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  const byName = useMemo(
    () => new Map(data.map((item) => [item.name, item])),
    [data],
  );

  // Color scale from a dark muted blue to the theme's bright primary blue
  const colorScale = scaleLinear<string>()
    .domain([0, maxVal])
    .range(["#1a2235", "#00d4ff"]);

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ComposableMap
        projectionConfig={{
          scale: 140,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const d = byName.get(geo.properties.name);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={d ? colorScale(d.value) : "var(--color-surface-3)"}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      fill: d ? "#7dd3fc" : "var(--color-surface-2)",
                      outline: "none",
                      cursor: "pointer"
                    },
                    pressed: { outline: "none" },
                  }}
                >
                  <title>
                    {geo.properties.name}
                    {d ? `: ${formatNumber(d.value)} unique visitors` : ""}
                  </title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
