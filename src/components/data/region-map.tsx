"use client";
import { useEffect, useRef, useState } from 'react';
import { Map as LibreMap, Popup, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Geometry } from 'geojson';
import { LocateFixed, Minus, Plus, MapPinned } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import type { RegionRecord } from '@/lib/regions';
import land from '@/data/indonesia-land.json';
import 'maplibre-gl/dist/maplibre-gl.css';

export type RegionMapProps = {
  regions: RegionRecord[];
  selected: string | null;
  onSelect: (code: string) => void;
  colors?: Record<string, string>;
  descriptions?: Record<string, string>;
  nationalOverview?: boolean;
  comparisonYears?: number[];
  mapYear?: number;
  onMapYearChange?: (year: number) => void;
};
type Boundaries = FeatureCollection<Geometry, { code: string }>;
const extent: [[number, number], [number, number]] = [[94, -11.5], [142, 7]];
setWorkerUrl(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/maplibre/maplibre-gl-worker.mjs`);

function yearSelection(props: RegionMapProps) {
  return props.comparisonYears && props.mapYear !== undefined && props.onMapYearChange;
}

export default function RegionMap(props: RegionMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const latest = useRef(props);
  const geometry = useRef<Boundaries>({ type: 'FeatureCollection', features: [] });
  const sourceKey = useRef('');
  const colorKey = useRef('');
  const viewKey = useRef('');
  const colorTimers = useRef<number[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  function update(map: LibreMap, current: RegionMapProps) {
    if (!map.getSource('boundary')) return;
    const codes = new Set(current.regions.map(region => region.code));
    const shapes = geometry.current.features.filter(feature => codes.has(feature.properties.code));
    const nextSourceKey = JSON.stringify([current.selected, current.regions.map(region => region.code), current.colors]);
    const nextColorKey = JSON.stringify([current.regions.map(region => region.code), current.colors]);
    const colorsChanged = colorKey.current !== '' && colorKey.current !== nextColorKey;
    colorKey.current = nextColorKey;

    if (sourceKey.current !== nextSourceKey) {
      sourceKey.current = nextSourceKey;
      const boundaryFeatures = shapes.map(feature => ({
        ...feature,
        id: feature.properties.code,
        properties: { ...feature.properties, selected: feature.properties.code === current.selected, color: current.colors?.[feature.properties.code] ?? '#a2c8e5' },
      }));
      (map.getSource('boundary') as GeoJSONSource).setData({ type: 'FeatureCollection', features: boundaryFeatures });
      const boundaryCodes = new Set(shapes.map(feature => feature.properties.code));
      (map.getSource('regions') as GeoJSONSource).setData({ type: 'FeatureCollection', features: current.regions.filter(region => (!boundaryCodes.has(region.code) || region.code === current.selected) && region.longitude !== null && region.latitude !== null).map(region => ({ type: 'Feature', id: region.code, geometry: { type: 'Point', coordinates: [region.longitude!, region.latitude!] }, properties: { code: region.code, selected: region.code === current.selected } })) });

      if (colorsChanged && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        colorTimers.current.forEach(window.clearTimeout);
        colorTimers.current = [];
        const longitudes = new Map(current.regions.map(region => [region.code, region.longitude ?? 0]));
        const ordered = [...shapes].sort((a, b) => (longitudes.get(a.properties.code) ?? 0) - (longitudes.get(b.properties.code) ?? 0));
        const groupSize = Math.max(1, Math.ceil(ordered.length / 10));
        for (let start = 0; start < ordered.length; start += groupSize) {
          const group = ordered.slice(start, start + groupSize);
          const timer = window.setTimeout(() => group.forEach(feature => map.setFeatureState({ source: 'boundary', id: feature.properties.code }, { color: current.colors?.[feature.properties.code] ?? '#a2c8e5' })), Math.floor(start / groupSize) * 10);
          colorTimers.current.push(timer);
        }
      } else {
        colorTimers.current.forEach(window.clearTimeout);
        colorTimers.current = [];
        shapes.forEach(feature => map.setFeatureState({ source: 'boundary', id: feature.properties.code }, { color: current.colors?.[feature.properties.code] ?? '#a2c8e5' }));
      }
    }

    const nextViewKey = JSON.stringify([current.selected, shapes.map(feature => feature.properties.code), current.nationalOverview]);
    if (viewKey.current !== nextViewKey) {
      const animate = viewKey.current !== '' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      viewKey.current = nextViewKey;
      const bounds: [[number, number], [number, number]] = [[Infinity, Infinity], [-Infinity, -Infinity]];
      function collect(coords: unknown) {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === 'number') { bounds[0][0] = Math.min(bounds[0][0], coords[0]); bounds[0][1] = Math.min(bounds[0][1], coords[1]); bounds[1][0] = Math.max(bounds[1][0], coords[0]); bounds[1][1] = Math.max(bounds[1][1], coords[1]); }
        else coords.forEach(collect);
      }
      const focused = current.selected ? shapes.filter(feature => feature.properties.code === current.selected) : shapes;
      for (const feature of focused) if ('coordinates' in feature.geometry) collect(feature.geometry.coordinates);
      if (!Number.isFinite(bounds[0][0])) current.regions.filter(region => !current.selected || region.code === current.selected).forEach(region => { if (region.longitude !== null && region.latitude !== null) collect([region.longitude, region.latitude]); });
      map.fitBounds(current.nationalOverview || !Number.isFinite(bounds[0][0]) ? extent : bounds, { padding: { top: yearSelection(current) ? 78 : 52, bottom: 40, left: 45, right: 30 }, maxZoom: current.selected ? 11 : 8, duration: animate ? 300 : 0 });
    }
  }

  useEffect(() => { latest.current = props; if (mapRef.current) update(mapRef.current, props); }, [props]);
  useEffect(() => {
    if (!container.current) return;
    const abort = new AbortController();
    // A replacement map has empty sources, even when the selected filters have not changed.
    sourceKey.current = colorKey.current = viewKey.current = '';
    function fail(error: unknown, message: string) {
      if (abort.signal.aborted) return;
      console.error('PRPDN map:', error);
      setErrorMessage(message);
      setState('error');
    }
    let map: LibreMap;
    try { map = new LibreMap({ container: container.current, attributionControl: false, bounds: extent, minZoom: 1, maxZoom: 13, renderWorldCopies: false, scrollZoom: false, dragRotate: false, pitchWithRotate: false, style: { version: 8, sources: {}, layers: [{ id: 'water', type: 'background', paint: { 'background-color': '#f4f8fc' } }] }, locale: { 'Map.Title': 'Peta wilayah administratif' } }); }
    catch (error) { queueMicrotask(() => fail(error, 'Browser tidak dapat memulai peta WebGL. Coba muat ulang atau gunakan browser dengan akselerasi grafis.')); return () => abort.abort(); }
    mapRef.current = map;
    const popup = new Popup({ closeButton: false, closeOnClick: false });
    map.on('load', async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/region-boundaries.json`, { signal: abort.signal });
        if (!response.ok) throw new Error(`Geometry unavailable: HTTP ${response.status}`);
        geometry.current = await response.json() as Boundaries;
        if (abort.signal.aborted) return;
        map.addSource('land', { type: 'geojson', data: land as FeatureCollection });
        map.addLayer({ id: 'land', source: 'land', type: 'fill', paint: { 'fill-color': '#e5e9ed', 'fill-outline-color': '#c7d2dc' } });
        map.addSource('boundary', { type: 'geojson', promoteId: 'code', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'boundary', source: 'boundary', type: 'fill', paint: { 'fill-color': ['coalesce', ['feature-state', 'color'], ['get', 'color']], 'fill-color-transition': { duration: 250, delay: 0 }, 'fill-opacity': 0.85 } });
        map.addLayer({ id: 'outline', source: 'boundary', type: 'line', paint: { 'line-color': ['case', ['get', 'selected'], '#0b2743', '#ffffff'], 'line-width': ['case', ['get', 'selected'], 2.5, 0.8] } });
        map.addSource('regions', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'points', source: 'regions', type: 'circle', paint: { 'circle-color': '#1769c2', 'circle-radius': ['case', ['get', 'selected'], 7, 5], 'circle-stroke-width': 1.5, 'circle-stroke-color': 'white' } });
        const layers = ['points', 'boundary'];
        map.on('click', event => { const feature = map.queryRenderedFeatures(event.point, { layers })[0]; if (feature) latest.current.onSelect(String(feature.properties.code)); });
        map.on('mousemove', event => {
          const feature = map.queryRenderedFeatures(event.point, { layers })[0];
          map.getCanvas().style.cursor = feature ? 'pointer' : 'grab';
          const region = latest.current.regions.find(item => item.code === String(feature?.properties.code));
          if (!region) { popup.remove(); return; }
          const content = document.createElement('div');
          content.className = 'region-map-popup-content';
          content.textContent = `${region.name}\nKode ${region.code}${latest.current.descriptions?.[region.code] ? `\n${latest.current.descriptions[region.code]}` : ''}\nKlik untuk memilih wilayah`;
          popup.setLngLat(event.lngLat).setDOMContent(content).addTo(map);
        });
        map.getCanvas().addEventListener('mouseleave', () => popup.remove());
        update(map, latest.current); setState('ready');
      } catch (error) { fail(error, 'Batas wilayah belum berhasil dimuat. Periksa koneksi lalu coba lagi.'); }
    });
    map.on('error', event => fail(event.error, 'Peta mengalami kendala saat menggambar wilayah. Coba lagi untuk memuat ulang peta.'));
    map.on('webglcontextlost', () => fail(new Error('WebGL context lost'), 'Koneksi grafis browser terputus. Coba lagi untuk memulai ulang peta.'));
    const observer = new ResizeObserver(() => {
      map.resize();
      viewKey.current = '';
      update(map, latest.current);
    });
    observer.observe(container.current);
    return () => { abort.abort(); observer.disconnect(); colorTimers.current.forEach(window.clearTimeout); popup.remove(); map.remove(); mapRef.current = null; };
  }, [attempt]);

  const selectedYears = yearSelection(props) ? props.comparisonYears! : [];
  return <div className="region-map"><div ref={container} className="region-map-canvas" aria-label="Peta wilayah. Gunakan filter atau tabel untuk pilihan melalui keyboard." />
    {state === 'ready' && <>
      <div className="region-map-controls"><Button variant="outline" size="icon" aria-label="Perbesar peta" onClick={() => mapRef.current?.zoomIn({ duration: 260 })}><Plus /></Button><Button variant="outline" size="icon" aria-label="Perkecil peta" onClick={() => mapRef.current?.zoomOut({ duration: 260 })}><Minus /></Button><Button variant="outline" size="icon" aria-label="Sesuaikan peta dengan pilihan" onClick={() => { if (mapRef.current) { viewKey.current = 'manual-refit'; update(mapRef.current, latest.current); } }}><LocateFixed /></Button></div>
      {yearSelection(props) && <div className="region-map-years" role="group" aria-label="Pilih tahun untuk warna peta">
        <span>Warna peta</span>
        {selectedYears.map(year => <Button key={year} variant={props.mapYear === year ? "default" : "outline"} size="sm" aria-pressed={props.mapYear === year} onClick={() => props.onMapYearChange?.(year)}>{year}</Button>)}
      </div>}
    </>}
    {(state !== 'ready' || !props.regions.length) && <Empty className="region-map-state">
      <EmptyHeader role="status" aria-live="polite">
        <EmptyMedia><MapPinned aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>{state === 'error' ? 'Peta tidak dapat ditampilkan' : state === 'loading' ? 'Memuat batas wilayah…' : 'Tidak ada wilayah sesuai filter'}</EmptyTitle>
        <EmptyDescription>{state === 'error' ? `${errorMessage} Data tetap tersedia melalui filter dan tabel.` : state === 'loading' ? 'Menyiapkan batas wilayah BIG Juni 2026. Filter dan tabel tetap dapat digunakan.' : 'Ubah pencarian atau reset filter untuk menampilkan wilayah.'}</EmptyDescription>
      </EmptyHeader>
      {state === 'error' && <Button variant="outline" onClick={() => { setState('loading'); setAttempt(value => value + 1); }}>Coba lagi</Button>}
    </Empty>}
    <span className="region-map-attribution">Latar: Natural Earth · Batas: BIG Juni 2026, disederhanakan</span>
  </div>;
}
