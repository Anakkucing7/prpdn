"use client";

import { useEffect, useRef, useState } from "react";
import { Map, Popup, setWorkerUrl, type GeoJSONSource, type MapMouseEvent } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { data, format, valueColor, type Province } from "@/lib/dashboard";
import land from "@/data/indonesia-land.json";
import boundaries from "@/data/province-boundaries.json";
import "maplibre-gl/dist/maplibre-gl.css";

type MapRow = Province & { value: number | null };
type Props = { rows: MapRow[]; selected: string; onSelect: (code: string) => void; min: number; max: number; label: string; unit: string; year: number };
const extent: [[number, number], [number, number]] = [[94, -11.5], [142, 7]];
setWorkerUrl(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/maplibre/maplibre-gl-worker.mjs`);

function features(props: Props): FeatureCollection {
  return { type: "FeatureCollection", features: props.rows.map(r => ({
    type: "Feature", geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
    properties: { code: r.code, name: r.label, value: r.value, color: valueColor(r.value, props.min, props.max), selected: r.code === props.selected, boundary: r.boundary },
  })) };
}

export default function ProvinceMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<Map | null>(null);
  const latest = useRef(props);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    latest.current = props;
    const map = instance.current;
    if (!map?.getSource("locations")) return;
    (map.getSource("locations") as GeoJSONSource).setData(features(props));
    const collection = { ...boundaries, features: boundaries.features.map(f => ({ ...f, properties: {
      ...f.properties, color: valueColor(props.rows.find(r => r.code === f.properties.code)?.value ?? null, props.min, props.max), selected: f.properties.code === props.selected,
    } })) };
    (map.getSource("provinces") as GeoJSONSource).setData(collection as FeatureCollection);
  }, [props]);

  useEffect(() => {
    if (!container.current) return;
    let map: Map;
    try {
      map = new Map({ container: container.current, attributionControl: false, renderWorldCopies: false,
        bounds: extent, fitBoundsOptions: { padding: 24 }, minZoom: 2, maxZoom: 10,
        dragRotate: false, pitchWithRotate: false, scrollZoom: false,
        style: { version: 8, sources: {}, layers: [{ id: "water", type: "background", paint: { "background-color": "#f4f8fc" } }] },
        locale: { "Map.Title": "Peta indikator provinsi" },
      });
    } catch { queueMicrotask(() => setFailed(true)); return; }
    instance.current = map;
    const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 12 });
    map.on("load", () => {
      const current = latest.current;
      map.addSource("land", { type: "geojson", data: land as FeatureCollection });
      map.addLayer({ id: "land", source: "land", type: "fill", paint: { "fill-color": "#e5e9ed", "fill-outline-color": "#bdcbd5" } });
      map.addSource("provinces", { type: "geojson", data: { ...boundaries, features: boundaries.features.map(f => ({ ...f, properties: { ...f.properties,
        color: valueColor(current.rows.find(r => r.code === f.properties.code)?.value ?? null, current.min, current.max), selected: f.properties.code === current.selected,
      } })) } as FeatureCollection });
      map.addLayer({ id: "province-fill", source: "provinces", type: "fill", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.9 } });
      map.addLayer({ id: "province-line", source: "provinces", type: "line", paint: { "line-color": ["case", ["get", "selected"], "#0b2743", "#ffffff"], "line-width": ["case", ["get", "selected"], 2.5, 0.7] } });
      map.addSource("locations", { type: "geojson", data: features(current) });
      map.addLayer({ id: "locations", source: "locations", type: "circle", paint: {
        "circle-color": ["get", "color"], "circle-radius": ["case", ["get", "selected"], 8, ["get", "boundary"], 0, 6],
        "circle-stroke-width": ["case", ["get", "selected"], 2.5, ["get", "boundary"], 0, 1.5], "circle-stroke-color": ["case", ["get", "selected"], "#0b2743", "#ffffff"],
      } });
      const targets = ["locations", "province-fill"];
      map.on("click", event => {
        const feature = map.queryRenderedFeatures(event.point, { layers: targets })[0];
        if (feature) latest.current.onSelect(String(feature.properties.code));
      });
      map.on("mousemove", (event: MapMouseEvent) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: targets })[0];
        map.getCanvas().style.cursor = feature ? "pointer" : "grab";
        if (!feature) { popup.remove(); return; }
        const current = latest.current;
        const row = current.rows.find(r => r.code === String(feature.properties.code));
        if (!row) return;
        const text = `${row.label}\n${current.label} ${current.year}: ${row.value === null ? "Tidak tersedia" : `${format(row.value)} ${current.unit}`}\nKlik untuk memilih provinsi`;
        popup.setLngLat(event.lngLat).setText(text).addTo(map);
      });
      map.getCanvas().addEventListener("mouseleave", () => popup.remove());
    });
    map.on("error", () => setFailed(true));
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => { observer.disconnect(); popup.remove(); map.remove(); instance.current = null; };
  }, [attempt]);

  return <div className="province-map">
    <div ref={container} className="map-canvas" aria-label="Peta interaktif. Alternatif keyboard: pilih provinsi pada filter atau daftar peringkat." />
    {failed ? <div className="map-fallback" role="status"><strong>Peta tidak dapat ditampilkan</strong><p>Gunakan filter provinsi atau daftar peringkat untuk menjelajahi data.</p><Button variant="outline" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>Coba lagi</Button></div> : null}
    <div className="map-controls" aria-label="Kontrol peta">
      <Button variant="outline" size="icon" aria-label="Perbesar peta" title="Perbesar peta" onClick={() => instance.current?.zoomIn({ duration: 0 })}><Plus /></Button>
      <Button variant="outline" size="icon" aria-label="Perkecil peta" title="Perkecil peta" onClick={() => instance.current?.zoomOut({ duration: 0 })}><Minus /></Button>
      <Button variant="outline" size="icon" aria-label="Tampilkan seluruh Indonesia" title="Tampilkan seluruh Indonesia" onClick={() => instance.current?.fitBounds(extent, { padding: 24, duration: 0 })}><LocateFixed /></Button>
    </div>
    <span className="map-level">Provinsi</span>
    <span className="map-attribution">Latar: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a> · Batas & titik: dim_wilayah</span>
    <span className="sr-only">{data.regions.length} provinsi. Batas terbaca untuk {data.boundaryCount} provinsi; {38 - data.boundaryCount} menggunakan titik lokasi dari workbook.</span>
  </div>;
}
