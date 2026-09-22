"use client";

import { useEffect, useRef, useState } from "react";
import { Map as LibreMap, Popup, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RegionRecord } from "@/lib/regions";
import land from "@/data/indonesia-land.json";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = { regions: RegionRecord[]; selected: string | null; onSelect: (code: string) => void };
type Boundaries = FeatureCollection<Geometry, { code: string }>;
const extent: [[number, number], [number, number]] = [[94, -11.5], [142, 7]];
setWorkerUrl(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/maplibre/maplibre-gl-worker.mjs`);

function points({ regions, selected }: Props): FeatureCollection {
  return { type: "FeatureCollection", features: regions.filter(r => r.longitude !== null && r.latitude !== null).map(r => ({ type: "Feature", geometry: { type: "Point", coordinates: [r.longitude!, r.latitude!] }, properties: { code: r.code, name: r.name, selected: r.code === selected } })) };
}

export default function RegionMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const latest = useRef(props);
  const geometry = useRef<Boundaries>({ type: "FeatureCollection", features: [] });
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  function update(map: LibreMap, current: Props) {
    if (!map.getSource("regions")) return;
    (map.getSource("regions") as GeoJSONSource).setData(points(current));
    const selected = geometry.current.features.filter(f => f.properties.code === current.selected);
    (map.getSource("boundary") as GeoJSONSource).setData({ type: "FeatureCollection", features: selected });
    const positions: number[][] = [];
    function collect(coords: unknown) {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === "number") positions.push(coords as number[]);
      else coords.forEach(collect);
    }
    for (const feature of selected) if ("coordinates" in feature.geometry) collect(feature.geometry.coordinates);
    if (!positions.length) current.regions.filter(r => !current.selected || r.code === current.selected).forEach(r => { if (r.longitude !== null && r.latitude !== null) positions.push([r.longitude, r.latitude]); });
    const bounds: [[number, number], [number, number]] = positions.length ? [[Math.min(...positions.map(p => p[0])), Math.min(...positions.map(p => p[1]))], [Math.max(...positions.map(p => p[0])), Math.max(...positions.map(p => p[1]))]] : extent;
    map.fitBounds(bounds, { padding: { top: 54, bottom: 38, left: 44, right: 30 }, maxZoom: 8, duration: 0 });
  }

  useEffect(() => { latest.current = props; if (mapRef.current) update(mapRef.current, props); }, [props]);
  useEffect(() => {
    if (!container.current) return;
    const abort = new AbortController();
    let map: LibreMap;
    try {
      map = new LibreMap({ container: container.current, attributionControl: false, bounds: extent, minZoom: 1, maxZoom: 13, renderWorldCopies: false, scrollZoom: false, dragRotate: false, pitchWithRotate: false, style: { version: 8, sources: {}, layers: [{ id: "water", type: "background", paint: { "background-color": "#f4f8fc" } }] }, locale: { "Map.Title": "Pratinjau spasial wilayah" } });
    } catch { queueMicrotask(() => setState("error")); return; }
    mapRef.current = map;
    const popup = new Popup({ closeButton: false, closeOnClick: false });
    map.on("load", async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/region-boundaries.json`, { signal: abort.signal });
        if (!response.ok) throw new Error("Geometry unavailable");
        geometry.current = await response.json() as Boundaries;
        if (abort.signal.aborted) return;
        map.addSource("land", { type: "geojson", data: land as FeatureCollection });
        map.addLayer({ id: "land", source: "land", type: "fill", paint: { "fill-color": "#e5e9ed", "fill-outline-color": "#c7d2dc" } });
        map.addSource("boundary", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "boundary", source: "boundary", type: "fill", paint: { "fill-color": "#8cb9db", "fill-opacity": 0.65 } });
        map.addLayer({ id: "outline", source: "boundary", type: "line", paint: { "line-color": "#1769c2", "line-width": 1.5 } });
        map.addSource("regions", { type: "geojson", data: points(latest.current) });
        map.addLayer({ id: "points", source: "regions", type: "circle", paint: { "circle-color": ["case", ["get", "selected"], "#0b2743", "#347db4"], "circle-radius": ["case", ["get", "selected"], 8, 5], "circle-stroke-width": 1.5, "circle-stroke-color": "white" } });
        map.on("click", "points", e => { const code = e.features?.[0]?.properties.code; if (code) latest.current.onSelect(String(code)); });
        map.on("mousemove", "points", e => { const feature = e.features?.[0]; if (feature) { map.getCanvas().style.cursor = "pointer"; popup.setLngLat(e.lngLat).setText(String(feature.properties.name)).addTo(map); } });
        map.on("mouseleave", "points", () => { map.getCanvas().style.cursor = ""; popup.remove(); });
        update(map, latest.current);
        setState("ready");
      } catch { if (!abort.signal.aborted) setState("error"); }
    });
    map.on("error", () => setState("error"));
    const observer = new ResizeObserver(() => { map.resize(); update(map, latest.current); });
    observer.observe(container.current);
    return () => { abort.abort(); observer.disconnect(); popup.remove(); map.remove(); mapRef.current = null; };
  }, [attempt]);

  return <div className="region-map"><div ref={container} className="region-map-canvas" aria-label="Peta wilayah. Pilihan yang sama tersedia melalui tabel." />
    {state === "ready" && <div className="region-map-controls"><Button variant="outline" size="icon" aria-label="Perbesar peta" onClick={() => mapRef.current?.zoomIn({ duration: 0 })}><Plus /></Button><Button variant="outline" size="icon" aria-label="Perkecil peta" onClick={() => mapRef.current?.zoomOut({ duration: 0 })}><Minus /></Button><Button variant="outline" size="icon" aria-label="Sesuaikan peta dengan pilihan" onClick={() => { if (mapRef.current) update(mapRef.current, latest.current); }}><LocateFixed /></Button></div>}
    {state !== "ready" && <div className="region-map-state" role="status"><strong>{state === "loading" ? "Memuat pratinjau spasial…" : "Peta tidak dapat ditampilkan"}</strong><p>{state === "error" ? "Detail dan pilihan wilayah tetap tersedia melalui tabel." : "Menyiapkan batas dan titik dari workbook."}</p>{state === "error" && <Button variant="outline" onClick={() => { setState("loading"); setAttempt(attempt + 1); }}>Coba lagi</Button>}</div>}
    <span className="region-map-attribution">Latar: Natural Earth · Geometri: dim_wilayah</span>
  </div>;
}
