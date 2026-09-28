"use client";
import { useEffect, useRef, useState } from 'react';
import { Map as LibreMap, Popup, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Geometry } from 'geojson';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RegionRecord } from '@/lib/regions';
import land from '@/data/indonesia-land.json';
import 'maplibre-gl/dist/maplibre-gl.css';

export type RegionMapProps = { regions: RegionRecord[]; selected: string | null; onSelect: (code: string) => void; colors?: Record<string, string>; descriptions?: Record<string, string>; nationalOverview?: boolean };
type Boundaries = FeatureCollection<Geometry, { code: string }>;
const extent: [[number, number], [number, number]] = [[94, -11.5], [142, 7]];
setWorkerUrl(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/maplibre/maplibre-gl-worker.mjs`);
export default function RegionMap(props: RegionMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const latest = useRef(props);
  const geometry = useRef<Boundaries>({ type: 'FeatureCollection', features: [] });
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  function update(map: LibreMap, current: RegionMapProps) {
    if (!map.getSource('boundary')) return;
    const codes = new Set(current.regions.map(r => r.code));
    const shapes = geometry.current.features.filter(f => codes.has(f.properties.code));
    (map.getSource('boundary') as GeoJSONSource).setData({ type: 'FeatureCollection', features: shapes.map(f => ({ ...f, properties: { ...f.properties, selected: f.properties.code === current.selected, color: current.colors?.[f.properties.code] ?? '#a2c8e5' } })) });
    const boundaryCodes = new Set(shapes.map(f => f.properties.code));
    (map.getSource('regions') as GeoJSONSource).setData({ type: 'FeatureCollection', features: current.regions.filter(r => (!boundaryCodes.has(r.code) || r.code === current.selected) && r.longitude !== null && r.latitude !== null).map(r => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [r.longitude!, r.latitude!] }, properties: { code: r.code, selected: r.code === current.selected } })) });
    const bounds: [[number, number], [number, number]] = [[Infinity, Infinity], [-Infinity, -Infinity]];
    function collect(coords: unknown) {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === 'number') { bounds[0][0] = Math.min(bounds[0][0], coords[0]); bounds[0][1] = Math.min(bounds[0][1], coords[1]); bounds[1][0] = Math.max(bounds[1][0], coords[0]); bounds[1][1] = Math.max(bounds[1][1], coords[1]); }
      else coords.forEach(collect);
    }
    const focused = current.selected ? shapes.filter(f => f.properties.code === current.selected) : shapes;
    for (const f of focused) if ('coordinates' in f.geometry) collect(f.geometry.coordinates);
    if (!Number.isFinite(bounds[0][0])) current.regions.filter(r => !current.selected || r.code === current.selected).forEach(r => { if (r.longitude !== null && r.latitude !== null) collect([r.longitude, r.latitude]); });
    map.fitBounds(current.nationalOverview || !Number.isFinite(bounds[0][0]) ? extent : bounds, { padding: { top: 52, bottom: 40, left: 45, right: 30 }, maxZoom: current.selected ? 11 : 8, duration: 0 });
  }
  useEffect(() => { latest.current = props; if (mapRef.current) update(mapRef.current, props); }, [props]);
  useEffect(() => {
    if (!container.current) return;
    const abort = new AbortController();
    let map: LibreMap;
    try { map = new LibreMap({ container: container.current, attributionControl: false, bounds: extent, minZoom: 1, maxZoom: 13, renderWorldCopies: false, scrollZoom: false, dragRotate: false, pitchWithRotate: false, style: { version: 8, sources: {}, layers: [{ id: 'water', type: 'background', paint: { 'background-color': '#f4f8fc' } }] }, locale: { 'Map.Title': 'Peta wilayah administratif' } }); }
    catch { queueMicrotask(() => setState('error')); return; }
    mapRef.current = map;
    const popup = new Popup({ closeButton: false, closeOnClick: false });
    map.on('load', async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/region-boundaries.json`, { signal: abort.signal });
        if (!response.ok) throw new Error('Geometry unavailable');
        geometry.current = await response.json() as Boundaries;
        if (abort.signal.aborted) return;
        map.addSource('land', { type: 'geojson', data: land as FeatureCollection });
        map.addLayer({ id: 'land', source: 'land', type: 'fill', paint: { 'fill-color': '#e5e9ed', 'fill-outline-color': '#c7d2dc' } });
        map.addSource('boundary', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'boundary', source: 'boundary', type: 'fill', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.85 } });
        map.addLayer({ id: 'outline', source: 'boundary', type: 'line', paint: { 'line-color': ['case', ['get', 'selected'], '#0b2743', '#ffffff'], 'line-width': ['case', ['get', 'selected'], 2.5, 0.8] } });
        map.addSource('regions', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'points', source: 'regions', type: 'circle', paint: { 'circle-color': '#1769c2', 'circle-radius': ['case', ['get', 'selected'], 7, 5], 'circle-stroke-width': 1.5, 'circle-stroke-color': 'white' } });
        const layers = ['points', 'boundary'];
        map.on('click', e => { const feature = map.queryRenderedFeatures(e.point, { layers })[0]; if (feature) latest.current.onSelect(String(feature.properties.code)); });
        map.on('mousemove', e => {
          const feature = map.queryRenderedFeatures(e.point, { layers })[0];
          map.getCanvas().style.cursor = feature ? 'pointer' : 'grab';
          const region = latest.current.regions.find(r => r.code === String(feature?.properties.code));
          if (!region) { popup.remove(); return; }
          popup.setLngLat(e.lngLat).setText(`${region.name}\nKode ${region.code}${latest.current.descriptions?.[region.code] ? `\n${latest.current.descriptions[region.code]}` : ''}\nKlik untuk memilih wilayah`).addTo(map);
        });
        map.getCanvas().addEventListener('mouseleave', () => popup.remove());
        update(map, latest.current); setState('ready');
      } catch { if (!abort.signal.aborted) setState('error'); }
    });
    map.on('error', () => setState('error'));
    const observer = new ResizeObserver(() => { map.resize(); update(map, latest.current); });
    observer.observe(container.current);
    return () => { abort.abort(); observer.disconnect(); popup.remove(); map.remove(); mapRef.current = null; };
  }, [attempt]);
  return <div className="region-map"><div ref={container} className="region-map-canvas" aria-label="Peta wilayah. Gunakan filter atau tabel untuk pilihan melalui keyboard." />
    {state === 'ready' && <div className="region-map-controls"><Button variant="outline" size="icon" aria-label="Perbesar peta" onClick={() => mapRef.current?.zoomIn({ duration: 0 })}><Plus /></Button><Button variant="outline" size="icon" aria-label="Perkecil peta" onClick={() => mapRef.current?.zoomOut({ duration: 0 })}><Minus /></Button><Button variant="outline" size="icon" aria-label="Sesuaikan peta dengan pilihan" onClick={() => { if (mapRef.current) update(mapRef.current, latest.current); }}><LocateFixed /></Button></div>}
    {state !== 'ready' && <div className="region-map-state" role="status"><strong>{state === 'loading' ? 'Memuat batas resmi…' : 'Peta tidak dapat ditampilkan'}</strong><p>{state === 'error' ? 'Pilihan wilayah tetap tersedia melalui filter dan tabel.' : 'Menyiapkan batas wilayah BIG Juni 2026.'}</p>{state === 'error' && <Button variant="outline" onClick={() => { setState('loading'); setAttempt(attempt + 1); }}>Coba lagi</Button>}</div>}
    <span className="region-map-attribution">Latar: Natural Earth · Batas: BIG Juni 2026, disederhanakan</span>
  </div>;
}
