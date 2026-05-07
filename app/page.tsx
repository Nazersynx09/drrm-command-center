"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Home, Activity, Bell, MapPin, ShieldAlert, Sun, Moon, X
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreItem    { label: string; val: string; }
interface Incident     { time: string; town: string; msg: string; severity: 'High' | 'Medium' | 'Low'; }
interface MarkerData   { id: string; lat: number; lng: number; name: string; type: string; desc: string; severity: 'High' | 'Medium' | 'Low'; timestamp: string; }
interface AdvisoryData { title: string; type: 'Critical' | 'Warning' | 'Info'; issuer: string; time: string; msg: string; detail: Record<string, string>; }

// ─── Static data ──────────────────────────────────────────────────────────────

const INCIDENTS: Incident[] = [
  { time: '10:52 AM', town: 'Zarraga',      msg: 'Flash flood in Brgy. Poblacion, water at 1.2 m depth',          severity: 'High'   },
  { time: '10:42 AM', town: 'Lambunao',     msg: 'Fallen utility post blocking primary road, BFP responding',      severity: 'Medium' },
  { time: '10:38 AM', town: 'Oton',         msg: 'Flash flood in Brgy. Trapiche, 45 families affected',            severity: 'High'   },
  { time: '10:30 AM', town: 'Miagao',       msg: 'Minor landslide near university area, road partially blocked',   severity: 'Medium' },
  { time: '10:15 AM', town: 'Passi City',   msg: 'Water level at Jalaur bridge hits Alert Level 2',               severity: 'High'   },
  { time: '10:02 AM', town: 'Leganes',      msg: 'Flooding on national highway, 200 m stretch submerged',          severity: 'High'   },
  { time: '09:50 AM', town: 'Sta. Barbara', msg: 'School building roof partially damaged by strong winds',         severity: 'Medium' },
  { time: '09:44 AM', town: 'Pavia',        msg: 'Electrical lines down on two barangays, ILECO notified',        severity: 'Medium' },
  { time: '09:30 AM', town: 'San Miguel',   msg: 'Displaced families requesting food packs — 28 households',      severity: 'Low'    },
  { time: '09:15 AM', town: 'Carles',       msg: 'Fishing vessels pulled ashore, no-sail advisory enforced',      severity: 'Low'    },
  { time: '09:08 AM', town: 'Cabatuan',     msg: 'Bridge crossing submerged at Brgy. Caarosipan junction',        severity: 'High'   },
  { time: '08:55 AM', town: 'Dingle',       msg: 'Road debris from landslide, DPWH clearing operations active',   severity: 'Medium' },
];

const MARKERS: MarkerData[] = [
  // Incidents
  { id: 'zarraga',    lat: 10.9427, lng: 122.6897, name: 'Zarraga',      type: 'Flash Flood',       desc: 'Severe flooding in Brgy. Poblacion. Water at 1.2 m. LGU responders on site.',      severity: 'High',   timestamp: '10:52 AM' },
  { id: 'oton',       lat: 10.7000, lng: 122.4769, name: 'Oton',         type: 'Flash Flood',       desc: 'Flash flood in Brgy. Trapiche. 45 families affected, 3 roads impassable.',          severity: 'High',   timestamp: '10:38 AM' },
  { id: 'passi',      lat: 11.1063, lng: 122.6378, name: 'Passi City',   type: 'Flood Warning',     desc: 'Jalaur bridge at Alert Level 2. Water monitoring every 30 min.',                    severity: 'High',   timestamp: '10:15 AM' },
  { id: 'lambunao',   lat: 11.0492, lng: 122.4905, name: 'Lambunao',     type: 'Road Blockage',     desc: 'Fallen utility post blocking primary road. BFP team dispatched.',                   severity: 'Medium', timestamp: '10:42 AM' },
  { id: 'miagao',     lat: 10.6457, lng: 122.2337, name: 'Miagao',       type: 'Landslide',         desc: 'Minor landslide near university area. Road partially blocked, clearing ongoing.',   severity: 'Medium', timestamp: '10:30 AM' },
  { id: 'leganes',    lat: 10.7965, lng: 122.5691, name: 'Leganes',      type: 'Road Flood',        desc: 'Flooding on national highway, 200 m stretch submerged.',                            severity: 'High',   timestamp: '10:02 AM' },
  // Evacuation centres
  { id: 'citygym',    lat: 10.7202, lng: 122.5621, name: 'City Gym Iloilo',    type: 'Evacuation Center', desc: 'Capacity: 850 | Current: 712. Meals 3×/day. Medical team on-site.',         severity: 'Low',    timestamp: 'Active' },
  { id: 'stabarbara', lat: 10.8283, lng: 122.5330, name: 'Sta. Barbara Gym',   type: 'Evacuation Center', desc: 'Capacity: 500 | Current: 493. Near capacity — monitoring closely.',           severity: 'Medium', timestamp: 'Active' },
  { id: 'leon',       lat: 10.7667, lng: 122.3833, name: 'Leon Covered Court', type: 'Evacuation Center', desc: 'Capacity: 300 | Current: 198. DSWD relief goods available.',                 severity: 'Low',    timestamp: 'Active' },
];

const ADVISORIES: AdvisoryData[] = [
  {
    title: 'Gale Warning #4', type: 'Critical', issuer: 'PDRRMO Iloilo', time: '5m ago',
    msg: 'No sail policy for all small seacraft in Northern Iloilo (Carles, Estancia, Batad).',
    detail: { Scope: 'All small seacraft banned', Area: 'Northern Iloilo waters', Hotline: '(033) 337-7034', 'Lifted when': 'Signal downgraded' },
  },
  {
    title: 'Weather Bulletin #12', type: 'Warning', issuer: 'PAGASA', time: '1h ago',
    msg: 'SW Monsoon enhanced by Typhoon Egay. Moderate to heavy rain expected within 24 hours.',
    detail: { Rainfall: 'Moderate to heavy', Wind: '45–65 km/h gusts', 'Valid until': '6:00 AM tomorrow', Signal: 'Signal No. 2' },
  },
  {
    title: 'Water Pressure Alert', type: 'Info', issuer: 'MDRRMO Leon', time: '2h ago',
    msg: 'Low water pressure in Leon municipal center. Metro Iloilo Water District notified.',
    detail: { Area: 'Leon municipal center', Action: 'MIWD notified', 'Est. restore': 'Within 12 hours', Priority: 'Low' },
  },
  {
    title: 'River Level Warning', type: 'Critical', issuer: 'PAGASA-EFCOS', time: '3h ago',
    msg: 'Jalaur River at Alert Level 2. Communities within 500 m advised to prepare for evacuation.',
    detail: { 'Alert level': 'Level 2 of 3', Action: 'Evacuation readiness', Radius: '500 m from riverbank', Status: 'Active monitoring' },
  },
  {
    title: 'Road Closure Notice', type: 'Warning', issuer: 'DPWH Region 6', time: '4h ago',
    msg: 'Lambunao-Igbaras highway closed due to flooding and debris.',
    detail: { Status: 'Closed', Reason: 'Flooding & debris', Alternate: 'Via Barotac Nuevo', 'Est. reopen': 'Pending assessment' },
  },
];

// ─── Theme factory ────────────────────────────────────────────────────────────

type Theme = ReturnType<typeof makeTheme>;

function makeTheme(dark: boolean) {
  return {
    dark,
    pageBg:        dark ? 'bg-[#00111f]'              : 'bg-slate-100',
    pageText:      dark ? 'text-white'                 : 'text-slate-900',
    cardBg:        dark ? 'bg-[#071a2b]'              : 'bg-white',
    cardBorder:    dark ? 'border-white/[0.07]'        : 'border-slate-200',
    cardHover:     dark ? 'hover:border-orange-500/40' : 'hover:border-blue-400/70',
    panelBg:       dark ? 'bg-[#040f1b]'              : 'bg-white',
    panelBorder:   dark ? 'border-white/[0.07]'        : 'border-slate-200',
    stripBg:       dark ? 'bg-[#00111f]'              : 'bg-slate-100',
    subheadBg:     dark ? 'bg-black/30'               : 'bg-slate-50',
    subheadBorder: dark ? 'border-white/[0.06]'        : 'border-slate-200',
    mapBg:         dark ? 'bg-[#030d18]'              : 'bg-slate-200',
    chipBg:        dark ? 'bg-white/[0.06]'            : 'bg-slate-100',
    cardTitle:     dark ? 'text-white/65'              : 'text-slate-500',
    muted:         dark ? 'text-white/38'              : 'text-slate-400',
    bodyText:      dark ? 'text-white/72'              : 'text-slate-700',
    scoreDivider:  dark ? 'bg-white/[0.09]'            : 'bg-slate-200',
    advCardBg:     dark ? 'bg-white/[0.03]'            : 'bg-slate-50',
    advCardBorder: dark ? 'border-white/[0.06]'        : 'border-slate-200',
    advCardHover:  dark ? 'hover:border-white/[0.16]'  : 'hover:border-slate-300',
    advTitle:      dark ? 'text-[#FFB81C]'             : 'text-[#003580]',
    rowBorder:     dark ? 'border-white/[0.05]'        : 'border-slate-100',
    rowHover:      dark ? 'hover:bg-white/[0.04]'      : 'hover:bg-slate-50',
    theadBg:       dark ? 'bg-[#040f1b]'              : 'bg-slate-100',
    theadText:     dark ? 'text-white/42'              : 'text-slate-500',
    theadBorder:   dark ? 'border-white/[0.06]'        : 'border-slate-200',
    selectStyle:   dark ? 'bg-[#040f1b] border-white/20 text-white/60' : 'bg-white border-slate-300 text-slate-600',
    layerInactive: dark ? 'bg-black/40 border-white/10 text-white/40'  : 'bg-white border-slate-300 text-slate-500',
    modalBg:       dark ? 'bg-[#052040]'              : 'bg-white',
    modalDivide:   dark ? 'divide-white/[0.06]'        : 'divide-slate-100',
    modalRowBg:    dark ? 'bg-white/[0.04]'            : 'bg-slate-50',
    feedTitle:     dark ? 'text-[#FFB81C]'             : 'text-[#003580]',
    sevPillHigh:   dark ? 'bg-red-500/20 text-red-400'        : 'bg-red-50 text-red-600',
    sevPillMed:    dark ? 'bg-orange-500/20 text-orange-400'   : 'bg-orange-50 text-orange-600',
    sevPillLow:    dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
  } as const;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEV_TEXT: Record<string, string> = {
  High: 'text-red-500', Medium: 'text-orange-400', Low: 'text-emerald-500',
};
const ADV_TYPE_BG: Record<string, string> = {
  Critical: 'bg-red-600', Warning: 'bg-orange-500', Info: 'bg-blue-600',
};

// ─── Leaflet map (rendered inside an iframe so Leaflet loads cleanly) ─────────

function LiveMap({
  dark,
  showIncidents,
  showEvac,
  showFloods,
  onMarkerClick,
}: {
  dark: boolean;
  showIncidents: boolean;
  showEvac: boolean;
  showFloods: boolean;
  onMarkerClick: (m: MarkerData) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build the full self-contained HTML page that runs Leaflet inside the iframe
  const buildHtml = useCallback(() => {
    const incidentMarkers  = MARKERS.filter(m => m.type !== 'Evacuation Center');
    const evacMarkers      = MARKERS.filter(m => m.type === 'Evacuation Center');

    const markerJs = (markers: MarkerData[], show: boolean) =>
      markers.map(m => {
        const color = m.severity === 'High' ? '#ef4444' : m.severity === 'Medium' ? '#f97316' : '#22c55e';
        const icon  = m.type === 'Evacuation Center'
          ? `L.divIcon({ className:'', html: \`<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 6px ${color}88"></div>\`, iconSize:[14,14], iconAnchor:[7,7] })`
          : `L.divIcon({ className:'', html: \`<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color}aa;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:12px">!</div>\`, iconSize:[20,20], iconAnchor:[10,10] })`;

        return `
          {
            var m = L.marker([${m.lat}, ${m.lng}], { icon: ${icon} });
            m.bindPopup(\`<div style="font-family:sans-serif;min-width:180px">
              <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;margin-bottom:2px">${m.type}</div>
              <div style="font-size:13px;font-weight:800;margin-bottom:4px">${m.name}</div>
              <div style="font-size:11px;color:#555;line-height:1.4">${m.desc}</div>
              <div style="margin-top:6px;font-size:10px;color:#888">⏱ ${m.timestamp}</div>
            </div>\`, { maxWidth: 220 });
            m.on('click', function() { window.parent.postMessage({ type:'markerClick', id:'${m.id}' }, '*'); });
            ${show ? 'incidentGroup.addLayer(m);' : ''}
          }
        `;
      }).join('\n');

    const tileUrl = dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; }
  .leaflet-popup-content-wrapper { border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,0.25); }
  .leaflet-popup-tip { background:#fff; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true, attributionControl: true })
    .setView([10.85, 122.54], 10);

  L.tileLayer('${tileUrl}', {
    attribution: '${attribution}',
    subdomains: 'abcd',
    maxZoom: 18
  }).addTo(map);

  var incidentGroup = L.layerGroup().addTo(map);
  var evacGroup     = L.layerGroup().addTo(map);
  var floodGroup    = L.layerGroup();

  // Flood zones (circles)
  var floodZones = [
    { lat: 10.942, lng: 122.690, r: 2200, name: 'Flood Zone A — Zarraga' },
    { lat: 10.828, lng: 122.533, r: 1800, name: 'Flood Zone B — Sta. Barbara' },
    { lat: 10.700, lng: 122.477, r: 2000, name: 'Flood Zone C — Oton' },
  ];
  floodZones.forEach(function(z) {
    L.circle([z.lat, z.lng], {
      radius: z.r, color: '#3b82f6', fillColor: '#3b82f6',
      fillOpacity: 0.12, weight: 1.5, dashArray: '6 4'
    }).bindTooltip(z.name, { permanent: false, className: 'leaflet-tooltip' })
     .addTo(floodGroup);
  });

  ${showFloods ? 'floodGroup.addTo(map);' : ''}

  // Incident markers
  ${markerJs(incidentMarkers, showIncidents)}

  // Evac centre markers
  ${evacMarkers.map(m => {
    const color = m.severity === 'High' ? '#ef4444' : m.severity === 'Medium' ? '#f97316' : '#22c55e';
    return `{
      var icon = L.divIcon({ className:'', html: \`<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 6px ${color}88"></div>\`, iconSize:[14,14], iconAnchor:[7,7] });
      var m = L.marker([${m.lat}, ${m.lng}], { icon: icon });
      m.bindPopup(\`<div style="font-family:sans-serif;min-width:180px">
        <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;margin-bottom:2px">${m.type}</div>
        <div style="font-size:13px;font-weight:800;margin-bottom:4px">${m.name}</div>
        <div style="font-size:11px;color:#555;line-height:1.4">${m.desc}</div>
        <div style="margin-top:6px;font-size:10px;color:#888">⏱ ${m.timestamp}</div>
      </div>\`, { maxWidth: 220 });
      m.on('click', function() { window.parent.postMessage({ type:'markerClick', id:'${m.id}' }, '*'); });
      ${showEvac ? 'evacGroup.addLayer(m);' : ''}
    }`;
  }).join('\n')}

  // Listen for layer toggle messages from parent
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.source !== 'dashboard') return;
    if (e.data.action === 'toggleIncidents') {
      if (e.data.show) map.addLayer(incidentGroup); else map.removeLayer(incidentGroup);
    }
    if (e.data.action === 'toggleEvac') {
      if (e.data.show) map.addLayer(evacGroup); else map.removeLayer(evacGroup);
    }
    if (e.data.action === 'toggleFloods') {
      if (e.data.show) map.addLayer(floodGroup); else map.removeLayer(floodGroup);
    }
    if (e.data.action === 'panTo') {
      map.setView([e.data.lat, e.data.lng], 13, { animate: true });
    }
  });
</script>
</body>
</html>`;
  }, [dark, showIncidents, showEvac, showFloods]);

  const [html, setHtml] = useState('');

  // Only rebuild the iframe HTML when dark mode changes (tile style)
  // Layer visibility changes are handled via postMessage to avoid full reload
  useEffect(() => {
    setHtml(buildHtml());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark]);

  // Post layer toggle messages without rebuilding the iframe
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ source: 'dashboard', action: 'toggleIncidents', show: showIncidents }, '*');
  }, [showIncidents]);
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ source: 'dashboard', action: 'toggleEvac', show: showEvac }, '*');
  }, [showEvac]);
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ source: 'dashboard', action: 'toggleFloods', show: showFloods }, '*');
  }, [showFloods]);

  // Relay marker click events from iframe to parent
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'markerClick') {
        const m = MARKERS.find(x => x.id === e.data.id);
        if (m) onMarkerClick(m);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMarkerClick]);

  if (!html) return null;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      className="w-full h-full border-0"
      title="Iloilo Province Live Map"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

// ─── Scorecard ────────────────────────────────────────────────────────────────

function Scorecard({ title, icon, data, trend, t }: {
  title: string; icon: React.ReactNode; data: ScoreItem[]; trend: string; t: Theme;
}) {
  return (
    <div className={`border rounded-xl p-3 transition-all shadow-sm ${t.cardBg} ${t.cardBorder} ${t.cardHover}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg shrink-0 ${t.chipBg}`}>{icon}</div>
          <h3 className={`text-[10px] font-black uppercase tracking-tight truncate ${t.cardTitle}`}>{title}</h3>
        </div>
        <span className={`text-[8px] font-mono uppercase tracking-tighter shrink-0 ml-2 ${t.muted}`}>{trend}</span>
      </div>
      <div className="flex items-stretch">
        {data.map((d, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className={`w-px mx-3 self-stretch rounded-full ${t.scoreDivider}`} />}
            <div className="flex-1 min-w-0">
              <p className={`text-2xl font-black leading-none tracking-tight ${t.pageText}`}>{d.val}</p>
              <p className={`text-[9px] uppercase mt-1 font-semibold tracking-wider ${t.muted}`}>{d.label}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Advisory card ────────────────────────────────────────────────────────────

function AdvisoryCard({ adv, t, onClick }: { adv: AdvisoryData; t: Theme; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all space-y-2 ${t.advCardBg} ${t.advCardBorder} ${t.advCardHover}`}>
      <div className="flex justify-between items-start">
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${ADV_TYPE_BG[adv.type]}`}>{adv.type}</span>
        <span className={`text-[9px] font-mono ${t.muted}`}>{adv.time}</span>
      </div>
      <div>
        <h4 className={`text-xs font-bold ${t.advTitle}`}>{adv.title}</h4>
        <p className={`text-[9px] uppercase font-bold ${t.muted}`}>{adv.issuer}</p>
      </div>
      <p className={`text-[11px] leading-relaxed italic ${t.bodyText}`}>"{adv.msg}"</p>
    </div>
  );
}

// ─── Incident row ─────────────────────────────────────────────────────────────

function IncidentRow({ inc, t, onClick }: { inc: Incident; t: Theme; onClick: () => void }) {
  return (
    <tr onClick={onClick} className={`border-b cursor-pointer transition-colors ${t.rowBorder} ${t.rowHover}`}>
      <td className={`px-4 py-2 font-mono text-[11px] ${t.muted}`}>{inc.time}</td>
      <td className="px-4 py-2 font-black text-[#F37021] uppercase tracking-tighter text-[11px]">{inc.town}</td>
      <td className={`px-4 py-2 text-[11px] ${t.bodyText}`}>{inc.msg}</td>
      <td className={`px-4 py-2 text-right font-bold text-[9px] uppercase ${SEV_TEXT[inc.severity]}`}>{inc.severity}</td>
    </tr>
  );
}

// ─── Marker detail overlay ────────────────────────────────────────────────────

function DetailOverlay({ marker, t }: { marker: MarkerData | null; t: Theme }) {
  const pill = marker?.severity === 'High' ? t.sevPillHigh : marker?.severity === 'Medium' ? t.sevPillMed : t.sevPillLow;
  return (
    <div className={`absolute bottom-4 right-4 w-64 p-3 rounded-lg border shadow-2xl z-[500] backdrop-blur-sm pointer-events-none transition-all ${
      t.dark ? 'bg-[#052040]/95 border-white/20' : 'bg-white/96 border-slate-200'
    }`}>
      <h4 className="text-[10px] font-black text-[#F37021] mb-1 uppercase tracking-wider">
        {marker ? 'Selected Marker' : 'Map Selection'}
      </h4>
      {marker ? (
        <>
          <p className={`text-xs font-bold ${t.pageText}`}>{marker.name} — {marker.type}</p>
          <p className={`text-[10px] leading-tight mt-1 italic ${t.bodyText}`}>{marker.desc}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${pill}`}>{marker.severity}</span>
            <span className={`text-[9px] font-mono ${t.muted}`}>{marker.timestamp}</span>
          </div>
        </>
      ) : (
        <p className={`text-[10px] italic ${t.muted}`}>Click any marker on the map to view details.</p>
      )}
    </div>
  );
}

// ─── Advisory modal ───────────────────────────────────────────────────────────

function AdvisoryModal({ adv, t, onClose }: { adv: AdvisoryData; t: Theme; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`w-80 rounded-2xl border shadow-2xl p-5 ${t.modalBg} ${t.panelBorder}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className={`text-[8px] font-black uppercase text-white px-2 py-0.5 rounded ${ADV_TYPE_BG[adv.type]}`}>{adv.type}</span>
            <h3 className={`text-sm font-black mt-2 ${t.advTitle}`}>{adv.title}</h3>
            <p className={`text-[10px] uppercase font-bold ${t.muted}`}>{adv.issuer}</p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-full transition-all ${t.rowHover}`}>
            <X size={14} className={t.bodyText} />
          </button>
        </div>
        <p className={`text-xs italic mb-4 leading-relaxed ${t.bodyText}`}>"{adv.msg}"</p>
        <div className={`rounded-lg divide-y ${t.modalDivide} ${t.modalRowBg}`}>
          {Object.entries(adv.detail).map(([k, v]) => (
            <div key={k} className="flex justify-between px-3 py-2 text-[11px]">
              <span className={t.muted}>{k}</span>
              <span className={`font-bold ${t.pageText}`}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="mt-4 w-full py-2 bg-[#F37021] hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Incident modal ───────────────────────────────────────────────────────────

function IncidentModal({ inc, t, onClose }: { inc: Incident; t: Theme; onClose: () => void }) {
  const badgeBg = inc.severity === 'High' ? 'bg-red-600' : inc.severity === 'Medium' ? 'bg-orange-500' : 'bg-emerald-600';
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`w-80 rounded-2xl border shadow-2xl p-5 ${t.modalBg} ${t.panelBorder}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className={`text-[8px] font-black uppercase text-white px-2 py-0.5 rounded ${badgeBg}`}>{inc.severity} Severity</span>
            <h3 className={`text-sm font-black mt-2 ${t.advTitle}`}>{inc.town}</h3>
            <p className={`text-[10px] font-mono ${t.muted}`}>{inc.time}</p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-full transition-all ${t.rowHover}`}>
            <X size={14} className={t.bodyText} />
          </button>
        </div>
        <p className={`text-xs leading-relaxed mb-4 ${t.bodyText}`}>{inc.msg}</p>
        <div className={`rounded-lg divide-y text-[11px] ${t.modalDivide} ${t.modalRowBg}`}>
          {([['Location', inc.town], ['Reported', inc.time], ['Severity', inc.severity], ['Status', 'Active Response']] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between px-3 py-2">
              <span className={t.muted}>{k}</span>
              <span className={`font-bold ${k === 'Severity' ? SEV_TEXT[inc.severity] : t.pageText}`}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="mt-4 w-full py-2 bg-[#F37021] hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors">
          Acknowledge
        </button>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function IloiloExecutiveDashboard() {
  const [isDarkMode,     setIsDarkMode]     = useState(true);
  const [mounted,        setMounted]        = useState(false);
  const [currentTime,    setCurrentTime]    = useState<Date | null>(null);
  const [opSeconds,      setOpSeconds]      = useState(42 * 3600 + 12 * 60);
  const [reportCount,    setReportCount]    = useState(1284);
  const [totalToday,     setTotalToday]     = useState(142);

  const [activeMarker,    setActiveMarker]    = useState<MarkerData | null>(null);
  const [layerIncidents,  setLayerIncidents]  = useState(true);
  const [layerEvacuation, setLayerEvacuation] = useState(true);
  const [layerFloods,     setLayerFloods]     = useState(false);

  const [sevFilter,   setSevFilter]   = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [selectedAdv, setSelectedAdv] = useState<AdvisoryData | null>(null);
  const [selectedInc, setSelectedInc] = useState<Incident | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const clock = setInterval(() => { setCurrentTime(new Date()); setOpSeconds(s => s + 1); }, 1000);
    const live  = setInterval(() => {
      setReportCount(n => n + Math.floor(Math.random() * 3));
      setTotalToday(n => n + (Math.random() > 0.6 ? 1 : 0));
    }, 8000);
    return () => { clearInterval(clock); clearInterval(live); };
  }, []);

  const t        = makeTheme(isDarkMode);
  const opH      = Math.floor(opSeconds / 3600);
  const opM      = String(Math.floor((opSeconds % 3600) / 60)).padStart(2, '0');
  const opLabel  = `${opH}h ${opM}m`;
  const filtered = sevFilter === 'all' ? INCIDENTS : INCIDENTS.filter(i => i.severity === sevFilter);

  const toggleLayer = useCallback((layer: 'incidents' | 'evacuation' | 'floods') => {
    if (layer === 'incidents')  setLayerIncidents(v => !v);
    if (layer === 'evacuation') setLayerEvacuation(v => !v);
    if (layer === 'floods')     setLayerFloods(v => !v);
  }, []);

  const handleMarkerClick = useCallback((m: MarkerData) => {
    setActiveMarker(prev => prev?.id === m.id ? null : m);
  }, []);

  if (!mounted) return <div className="bg-[#00111f] h-screen" />;

  const layerDefs = [
    { key: 'incidents'  as const, label: 'Incidents',    active: layerIncidents  },
    { key: 'evacuation' as const, label: 'Evac Centers', active: layerEvacuation },
    { key: 'floods'     as const, label: 'Flood Zones',  active: layerFloods     },
  ];

  return (
    <>
      {selectedAdv && <AdvisoryModal adv={selectedAdv} t={t} onClose={() => setSelectedAdv(null)} />}
      {selectedInc && <IncidentModal inc={selectedInc} t={t} onClose={() => setSelectedInc(null)} />}

      <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 font-sans ${t.pageBg} ${t.pageText}`}>

        {/* ── TOP BAR ───────────────────────────────────────────────── */}
        <header className="bg-[#002B5B] border-b border-white/10 px-6 py-2 flex justify-between items-center shadow-2xl shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg shrink-0">
              <ShieldAlert className="text-[#002B5B]" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black uppercase tracking-tighter text-white">Typhoon Egay (Monitoring)</h1>
                <span className="px-2 py-0.5 bg-red-600 rounded text-[9px] font-black animate-pulse text-white whitespace-nowrap">RED ALERT</span>
              </div>
              <p className="text-[9px] text-white/50 font-mono italic">
                Last Sync: {currentTime?.toLocaleTimeString() ?? '--:--:--'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 border-x border-white/10 px-6">
              {[
                { label: 'Active Reports', val: reportCount.toLocaleString() },
                { label: 'Affected LGUs',  val: '38/42' },
                { label: 'Op. Time',       val: opLabel },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-[8px] uppercase text-white/40 leading-none mb-1">{m.label}</p>
                  <p className="text-xs font-black text-white">{m.val}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-mono text-white/50 uppercase">Live</span>
            </div>
            <button onClick={() => setIsDarkMode(v => !v)}
              className="p-2 rounded-full transition-all hover:bg-white/10" aria-label="Toggle theme">
              {isDarkMode ? <Sun size={18} className="text-[#FFB81C]" /> : <Moon size={18} className="text-white" />}
            </button>
          </div>
        </header>

        {/* ── SCORECARDS ───────────────────────────────────────────── */}
        <section className={`grid grid-cols-2 md:grid-cols-4 gap-3 px-3 py-3 shrink-0 ${t.stripBg}`}>
          <Scorecard t={t} title="Population Impact" trend="↑ Rising"
            icon={<Users     className="text-blue-500"    size={15} />}
            data={[{ label: 'Affected', val: '245k' }, { label: 'Displaced', val: '12.4k' }]}
          />
          <Scorecard t={t} title="Human Impact" trend="⚠ Critical"
            icon={<Activity  className="text-red-500"     size={15} />}
            data={[{ label: 'Casualty', val: '02' }, { label: 'Missing', val: '01' }]}
          />
          <Scorecard t={t} title="Infrastructure" trend="Assessment"
            icon={<Home      className="text-orange-500"  size={15} />}
            data={[{ label: 'Damaged', val: '1,034' }, { label: 'Cost', val: '₱42.8M' }]}
          />
          <Scorecard t={t} title="Evacuation" trend="84% Capacity"
            icon={<MapPin    className="text-emerald-500" size={15} />}
            data={[{ label: 'Centers', val: '114' }, { label: 'Evacuees', val: '12.5k' }]}
          />
        </section>

        {/* ── WORKSPACE ────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden px-3 gap-3 min-h-0">

          {/* MAP PANEL */}
          <main className={`flex-grow rounded-xl border overflow-hidden flex flex-col shadow-inner ${t.mapBg} ${t.cardBorder}`}>
            {/* Toolbar */}
            <div className={`px-4 py-2 border-b shrink-0 flex items-center justify-between ${t.subheadBg} ${t.subheadBorder}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${t.muted}`}>
                Iloilo Province — Live Situational Awareness
              </span>
              <div className="flex gap-2">
                {layerDefs.map(({ key, label, active }) => (
                  <button key={key} onClick={() => toggleLayer(key)}
                    className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all ${
                      active ? 'bg-[#002B5B] border-[#F37021] text-white' : t.layerInactive
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaflet map fills the rest */}
            <div className="flex-1 relative overflow-hidden min-h-0">
              <LiveMap
                dark={isDarkMode}
                showIncidents={layerIncidents}
                showEvac={layerEvacuation}
                showFloods={layerFloods}
                onMarkerClick={handleMarkerClick}
              />
              <DetailOverlay marker={activeMarker} t={t} />
            </div>
          </main>

          {/* ADVISORY PANEL */}
          <aside className={`w-[310px] lg:w-[340px] rounded-xl border flex flex-col shadow-xl ${t.panelBg} ${t.panelBorder}`}>
            <div className={`px-3 py-2.5 border-b shrink-0 flex items-center gap-2 ${t.subheadBg} ${t.subheadBorder}`}>
              <Bell size={13} className="text-[#F37021] shrink-0" />
              <h2 className={`text-[10px] font-black uppercase tracking-tight ${t.pageText}`}>Advisory & Alerts</h2>
              <span className={`ml-auto text-[9px] font-mono ${t.muted}`}>{ADVISORIES.length} active</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {ADVISORIES.map((adv, i) => (
                <AdvisoryCard key={i} adv={adv} t={t} onClick={() => setSelectedAdv(adv)} />
              ))}
            </div>
          </aside>
        </div>

        {/* ── INCIDENT FEED ─────────────────────────────────────────── */}
        <footer className={`h-[26%] mx-3 my-3 rounded-xl border flex flex-col overflow-hidden shadow-xl shrink-0 ${t.panelBg} ${t.panelBorder}`}>
          <div className={`px-4 py-2 border-b shrink-0 flex justify-between items-center ${t.subheadBg} ${t.subheadBorder}`}>
            <h2 className={`text-[10px] font-black uppercase flex items-center gap-2 ${t.feedTitle}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              Live Incident Stream
            </h2>
            <div className={`flex items-center gap-3 text-[9px] font-mono uppercase ${t.muted}`}>
              <span>Today: <strong className={t.pageText}>{totalToday}</strong></span>
              <span className="hidden sm:inline">Avg Response: 12m</span>
              <span className={`border-l pl-3 ${t.cardBorder}`}>Filter:</span>
              <select value={sevFilter}
                onChange={e => setSevFilter(e.target.value as typeof sevFilter)}
                className={`text-[9px] font-mono border rounded px-1.5 py-0.5 cursor-pointer focus:outline-none ${t.selectStyle}`}>
                <option value="all">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead className={`sticky top-0 text-[9px] uppercase border-b font-bold ${t.theadBg} ${t.theadText} ${t.theadBorder}`}>
                <tr>
                  <th className="px-4 py-2 w-24">Timestamp</th>
                  <th className="px-4 py-2 w-28">Location</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right w-20">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc, i) => (
                  <IncidentRow key={i} inc={inc} t={t} onClick={() => setSelectedInc(inc)} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className={`px-4 py-6 text-center text-[11px] ${t.muted}`}>
                      No incidents matching the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </footer>

      </div>
    </>
  );
}