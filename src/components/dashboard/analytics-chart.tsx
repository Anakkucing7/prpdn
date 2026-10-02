"use client";

import { useEffect, useRef } from "react";
import { init, use as registerCharts } from "echarts/core";
import { LineChart, ScatterChart } from "echarts/charts";
import { GridComponent, TooltipComponent, MarkLineComponent, AriaComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";

registerCharts([LineChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, AriaComponent, SVGRenderer]);

export default function AnalyticsChart({ option, label }: { option: EChartsOption; label: string }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const chart = init(container.current, undefined, { renderer: "svg" });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chart.setOption({ animation: !reducedMotion, animationDuration: 700, animationEasing: "cubicOut", animationDurationUpdate: reducedMotion ? 0 : 350, textStyle: { fontFamily: "Inter Variable, sans-serif", color: "#697386", fontSize: 12 }, ...option });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [option]);
  return <div ref={container} className="analytics-chart" role="img" aria-label={label} />;
}
