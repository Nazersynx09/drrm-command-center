'use client';

import { useEffect, useMemo } from 'react';
import type { MarkerData } from '@/lib/dashboard/types';
import { escapeHtml } from '@/lib/format';

type Props = {
  markers: MarkerData[];
  dark: boolean;
  showIncidents: boolean;
  showEvac: boolean;
  onMarkerClick: (marker: MarkerData) => void;
};

const SEVERITY_COLOR = { High: '#ef4444', Medium: '#f97316', Low: '#22c55e' } as const;

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
const ILOILO_CENTER = [10.85, 122.54];

function markerScript(m: MarkerData, visible: boolean) {
  const color = SEVERITY_COLOR[m.severity];
  return `if(${visible}){var mk=L.marker([${m.lat},${m.lng}],{icon:L.divIcon({className:'',html:'<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color}aa"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map);mk.bindPopup('<b>${escapeHtml(m.name)}</b><br>${escapeHtml(m.type)}<br><small>${escapeHtml(m.desc)}</small>');mk.on('click',()=>parent.postMessage({type:'markerClick',id:'${m.id}'},'*'));}`;
}

function buildMapHtml(markers: MarkerData[], dark: boolean, showIncidents: boolean, showEvac: boolean) {
  const tile = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const code = markers.map((m) => markerScript(m, m.evacuation ? showEvac : showIncidents)).join('');

  return `<!doctype html><html><head><link rel="stylesheet" href="${LEAFLET_CSS}"><script src="${LEAFLET_JS}"></script><style>html,body,#map{height:100%;margin:0}.leaflet-popup-content{font-family:Arial,sans-serif;font-size:11px}</style></head><body><div id="map"></div><script>var map=L.map('map').setView([${ILOILO_CENTER}],10);L.tileLayer('${tile}',{maxZoom:18,attribution:'© OpenStreetMap © CARTO'}).addTo(map);${code}</script></body></html>`;
}

export function LiveMap({ markers, dark, showIncidents, showEvac, onMarkerClick }: Props) {
  const html = useMemo(
    () => buildMapHtml(markers, dark, showIncidents, showEvac),
    [markers, dark, showIncidents, showEvac],
  );

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'markerClick') return;
      const marker = markers.find((x) => x.id === e.data.id);
      if (marker) onMarkerClick(marker);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [markers, onMarkerClick]);

  return (
    <iframe
      srcDoc={html}
      title="Iloilo situational map"
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
