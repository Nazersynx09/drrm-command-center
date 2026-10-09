'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MarkerData } from '@/lib/dashboard/types';

type Props = {
  markers: MarkerData[];
  dark: boolean;
  showIncidents: boolean;
  showEvac: boolean;
  onMarkerClick: (marker: MarkerData) => void;
};

// Free vector basemaps from OpenFreeMap: no API key, no usage limits.
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

// Iloilo province bounds [west, south, east, north]
const ILOILO_BOUNDS: [number, number, number, number] = [122.0, 10.45, 123.4, 11.65];

const SEVERITY_COLOR = { High: '#ef4444', Medium: '#f97316', Low: '#22c55e' } as const;

function addBoundaryLayers(map: MapLibreMap, dark: boolean) {
  const line = dark ? '#7aa7d9' : '#1f4e8c';

  if (!map.getSource('municipalities')) {
    map.addSource('municipalities', { type: 'geojson', data: '/geo/iloilo-municipalities.json' });
  }
  if (!map.getSource('barangays')) {
    map.addSource('barangays', { type: 'geojson', data: '/geo/iloilo-barangays.json' });
  }

  map.addLayer({
    id: 'municipality-fill',
    type: 'fill',
    source: 'municipalities',
    paint: { 'fill-color': line, 'fill-opacity': 0.06 },
  });
  map.addLayer({
    id: 'barangay-line',
    type: 'line',
    source: 'barangays',
    minzoom: 10.5,
    paint: { 'line-color': line, 'line-opacity': 0.35, 'line-width': 0.6 },
  });
  map.addLayer({
    id: 'municipality-line',
    type: 'line',
    source: 'municipalities',
    paint: { 'line-color': line, 'line-opacity': 0.85, 'line-width': 1.2 },
  });
  map.addLayer({
    id: 'municipality-label',
    type: 'symbol',
    source: 'municipalities',
    minzoom: 9,
    layout: { 'text-field': ['get', 'municipality'], 'text-size': 11, 'text-font': ['Noto Sans Regular'] },
    paint: {
      'text-color': dark ? '#d6e4f5' : '#1b365d',
      'text-halo-color': dark ? '#0b1b2e' : '#ffffff',
      'text-halo-width': 1.2,
    },
  });
}

function markerElement(marker: MarkerData) {
  const color = SEVERITY_COLOR[marker.severity];
  const el = document.createElement('button');
  el.type = 'button';
  el.setAttribute('aria-label', `${marker.name}: ${marker.type}`);
  el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color}aa;cursor:pointer;padding:0`;
  return el;
}

export function LiveMap({ markers, dark, showIncidents, showEvac, onMarkerClick }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const maplibreRef = useRef<typeof import('maplibre-gl') | null>(null);
  const darkRef = useRef(dark);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!container.current) return;
      try {
        const maplibre = await import('maplibre-gl');
        if (cancelled || !container.current) return;
        maplibreRef.current = maplibre;

        const map = new maplibre.Map({
          container: container.current,
          style: darkRef.current ? STYLE_DARK : STYLE_LIGHT,
          bounds: ILOILO_BOUNDS,
          fitBoundsOptions: { padding: 20 },
          attributionControl: { compact: true },
        });
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
        // style.load fires again after every setStyle(), so overlays are re-added on theme change.
        map.on('style.load', () => addBoundaryLayers(map, darkRef.current));
        mapRef.current = map;
        setReady(true);
      } catch {
        setError('The map could not start. Check that WebGL is enabled in your browser.');
      }
    }

    void init();
    return () => {
      cancelled = true;
      markerRefs.current.forEach((m) => m.remove());
      markerRefs.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch light/dark basemap.
  useEffect(() => {
    darkRef.current = dark;
    mapRef.current?.setStyle(dark ? STYLE_DARK : STYLE_LIGHT);
  }, [dark]);

  // Draw markers whenever the data or layer toggles change.
  useEffect(() => {
    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    if (!ready || !map || !maplibre) return;

    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = markers
      .filter((m) => (m.evacuation ? showEvac : showIncidents))
      .map((m) => {
        const el = markerElement(m);
        el.addEventListener('click', () => onMarkerClick(m));
        return new maplibre.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
      });
  }, [ready, markers, showIncidents, showEvac, onMarkerClick]);

  if (error) {
    return <div className="flex h-full items-center justify-center p-6 text-center text-xs">{error}</div>;
  }
  return <div ref={container} className="h-full w-full" />;
}
