"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Bell, Home, MapPin, Moon, ShieldAlert, Sun, Users, X } from 'lucide-react';

type Severity = 'High' | 'Medium' | 'Low';
type AdvisoryType = 'Critical' | 'Warning' | 'Info';

type Summary = {
  incident: null | {
    id: string; name: string; incidentCode: string; hazardType: string;
    description: string | null; alertLevel: string; status: string;
    startDate: string; endDate: string | null;
  };
  population: { affected: number; displaced: number };
  humanImpact: { casualties: number };
  infrastructure: { damaged: number; cost: number };
  evacuation: { centers: number; evacuees: number };
  reporting: { activeReports: number; affectedLGUs: number; totalLGUs: number };
  lastUpdated: string;
};

type Incident = {
  id: string; time: string; town: string; barangay: string; type: string;
  count: number; msg: string; actionsTaken: string | null; status: string | null;
  severity: Severity; lat: number | null; lng: number | null;
};

type MarkerData = {
  id: string; lat: number; lng: number; name: string; type: string; desc: string;
  severity: Severity; evacuation: boolean; affected: number; timestamp: string;
};

type Advisory = {
  id: string; title: string; type: AdvisoryType; issuer: string; source: string;
  issuedAt: string; expiresAt?: string; message: string; details: Record<string, string>;
  latitude?: number; longitude?: number; url?: string;
};

const EMPTY_SUMMARY: Summary = {
  incident: null,
  population: { affected: 0, displaced: 0 },
  humanImpact: { casualties: 0 },
  infrastructure: { damaged: 0, cost: 0 },
  evacuation: { centers: 0, evacuees: 0 },
  reporting: { activeReports: 0, affectedLGUs: 0, totalLGUs: 0 },
  lastUpdated: '',
};

function theme(dark: boolean) {
  return {
    pageBg: dark ? 'bg-[#00111f]' : 'bg-slate-100', pageText: dark ? 'text-white' : 'text-slate-900',
    cardBg: dark ? 'bg-[#071a2b]' : 'bg-white', cardBorder: dark ? 'border-white/[0.07]' : 'border-slate-200',
    panelBg: dark ? 'bg-[#040f1b]' : 'bg-white', panelBorder: dark ? 'border-white/[0.07]' : 'border-slate-200',
    subheadBg: dark ? 'bg-black/30' : 'bg-slate-50', subheadBorder: dark ? 'border-white/[0.06]' : 'border-slate-200',
    muted: dark ? 'text-white/40' : 'text-slate-400', body: dark ? 'text-white/70' : 'text-slate-700',
    rowBorder: dark ? 'border-white/[0.05]' : 'border-slate-100', rowHover: dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50',
    chip: dark ? 'bg-white/[0.06]' : 'bg-slate-100', mapBg: dark ? 'bg-[#030d18]' : 'bg-slate-200',
    select: dark ? 'bg-[#040f1b] border-white/20 text-white/70' : 'bg-white border-slate-300 text-slate-600',
  };
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-PH', { notation: n >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
}
function money(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toLocaleString('en-PH')}`;
}
function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function Scorecard({ title, icon, data, t }: { title: string; icon: React.ReactNode; data: [string, string][]; t: ReturnType<typeof theme> }) {
  return <div className={`border rounded-xl p-3 shadow-sm ${t.cardBg} ${t.cardBorder}`}>
    <div className="flex items-center gap-2 mb-3"><div className={`p-1.5 rounded-lg ${t.chip}`}>{icon}</div><h3 className={`text-[10px] font-black uppercase tracking-tight ${t.muted}`}>{title}</h3></div>
    <div className="grid grid-cols-2 divide-x divide-white/10">
      {data.map(([label, value]) => <div key={label} className="px-2 first:pl-0"><div className={`text-lg font-black leading-none ${t.pageText}`}>{value}</div><div className={`text-[8px] uppercase mt-1 ${t.muted}`}>{label}</div></div>)}
    </div>
  </div>;
}

function AdvisoryCard({ adv, t, onClick }: { adv: Advisory; t: ReturnType<typeof theme>; onClick: () => void }) {
  const bg = adv.type === 'Critical' ? 'bg-red-600' : adv.type === 'Warning' ? 'bg-orange-500' : 'bg-blue-600';
  return <button onClick={onClick} className={`w-full text-left p-3 rounded-lg border transition-all ${t.cardBg} ${t.cardBorder} hover:border-orange-400/60`}>
    <div className="flex justify-between items-start gap-2"><span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${bg}`}>{adv.type}</span><span className={`text-[9px] font-mono ${t.muted}`}>{timeAgo(adv.issuedAt)}</span></div>
    <h4 className="text-xs font-bold text-[#FFB81C] mt-2">{adv.title}</h4>
    <p className={`text-[9px] uppercase font-bold ${t.muted}`}>{adv.issuer} · {adv.source}</p>
    <p className={`text-[10px] leading-relaxed mt-2 ${t.body}`}>{adv.message}</p>
  </button>;
}

function Modal({ title, children, onClose, t }: { title: string; children: React.ReactNode; onClose: () => void; t: ReturnType<typeof theme> }) {
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
    <div onClick={e => e.stopPropagation()} className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 ${t.panelBg} ${t.panelBorder}`}>
      <div className="flex justify-between items-start mb-4"><h3 className={`text-sm font-black ${t.pageText}`}>{title}</h3><button onClick={onClose}><X size={16} className={t.body}/></button></div>
      {children}
    </div>
  </div>;
}

function LiveMap({ markers, dark, showIncidents, showEvac, onMarkerClick }: { markers: MarkerData[]; dark: boolean; showIncidents: boolean; showEvac: boolean; onMarkerClick: (m: MarkerData) => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const html = useMemo(() => {
    const tile = dark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const markerCode = markers.map(m => {
      const color = m.severity === 'High' ? '#ef4444' : m.severity === 'Medium' ? '#f97316' : '#22c55e';
      const visible = m.evacuation ? showEvac : showIncidents;
      return `if(${visible}){var mk=L.marker([${m.lat},${m.lng}],{icon:L.divIcon({className:'',html:'<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color}aa"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map);mk.bindPopup('<b>${escapeHtml(m.name)}</b><br>${escapeHtml(m.type)}<br><small>${escapeHtml(m.desc)}</small>');mk.on('click',()=>parent.postMessage({type:'markerClick',id:'${m.id}'},'*'));}`;
    }).join('');
    return `<!doctype html><html><head><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"><script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script><style>html,body,#map{height:100%;margin:0}.leaflet-popup-content{font-family:Arial,sans-serif;font-size:11px}</style></head><body><div id="map"></div><script>var map=L.map('map').setView([10.85,122.54],10);L.tileLayer('${tile}',{maxZoom:18,attribution:'© OpenStreetMap © CARTO'}).addTo(map);${markerCode}</script></body></html>`;
  }, [markers, dark, showIncidents, showEvac]);

  useEffect(() => {
    const handler = (e: MessageEvent) => { if (e.data?.type === 'markerClick') { const m = markers.find(x => x.id === e.data.id); if (m) onMarkerClick(m); } };
    window.addEventListener('message', handler); return () => window.removeEventListener('message', handler);
  }, [markers, onMarkerClick]);

  return <iframe ref={ref} srcDoc={html} title="Iloilo situational map" className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />;
}
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]!)); }

export default function IloiloExecutiveDashboard() {
  const [dark, setDark] = useState(true);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [sev, setSev] = useState<'all' | Severity>('all');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showEvac, setShowEvac] = useState(true);
  const [selectedAdv, setSelectedAdv] = useState<Advisory | null>(null);
  const [selectedInc, setSelectedInc] = useState<Incident | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const [s, i, m, a] = await Promise.all([
      fetch('/api/dashboard/summary', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/dashboard/incidents', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/dashboard/map', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/advisories', { cache: 'no-store' }).then(r => r.json()),
    ]);
    if (!s.error) setSummary(s);
    if (!i.error) setIncidents(i.incidents ?? []);
    if (!m.error) setMarkers(m.markers ?? []);
    if (!a.error) setAdvisories(a.advisories ?? []);
    setLastSync(new Date());
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  const t = theme(dark);
  const filtered = sev === 'all' ? incidents : incidents.filter(x => x.severity === sev);
  const alertClass = summary.incident?.alertLevel === 'RED' ? 'bg-red-600' : summary.incident?.alertLevel === 'BLUE' ? 'bg-blue-600' : 'bg-slate-600';

  return <div className={`h-screen flex flex-col overflow-hidden font-sans ${t.pageBg} ${t.pageText}`}>
    {selectedAdv && <Modal title={selectedAdv.title} onClose={() => setSelectedAdv(null)} t={t}>
      <div className="flex gap-2 mb-3"><span className="px-2 py-1 rounded text-[9px] font-black text-white bg-orange-500">{selectedAdv.type}</span><span className={`text-[10px] ${t.muted}`}>{selectedAdv.issuer} · {selectedAdv.source}</span></div>
      <p className={`text-xs leading-relaxed mb-4 ${t.body}`}>{selectedAdv.message}</p>
      <div className={`rounded-lg divide-y ${t.rowBorder}`}>{Object.entries(selectedAdv.details).map(([k,v]) => <div key={k} className="flex justify-between gap-4 px-3 py-2 text-[10px]"><span className={t.muted}>{k}</span><span className="font-bold text-right">{v}</span></div>)}</div>
      {selectedAdv.url && <a href={selectedAdv.url} target="_blank" rel="noreferrer" className="block mt-4 text-[10px] text-blue-400 underline">Open source</a>}
    </Modal>}
    {selectedInc && <Modal title={`${selectedInc.type} · ${selectedInc.town}`} onClose={() => setSelectedInc(null)} t={t}>
      <p className={`text-xs leading-relaxed mb-4 ${t.body}`}>{selectedInc.msg}</p>
      <div className={`rounded-lg divide-y ${t.rowBorder}`}>{[['Barangay',selectedInc.barangay],['Reported',new Date(selectedInc.time).toLocaleString('en-PH')],['Severity',selectedInc.severity],['Status',selectedInc.status ?? 'Reported'],['Count',String(selectedInc.count)]].map(([k,v])=><div key={k} className="flex justify-between px-3 py-2 text-[10px]"><span className={t.muted}>{k}</span><b>{v}</b></div>)}</div>
      {selectedInc.actionsTaken && <p className={`mt-4 text-[10px] ${t.body}`}><b>Actions:</b> {selectedInc.actionsTaken}</p>}
    </Modal>}
    {selectedMarker && <Modal title={selectedMarker.name} onClose={() => setSelectedMarker(null)} t={t}><p className={`text-xs ${t.body}`}>{selectedMarker.desc}</p></Modal>}

    <header className="bg-[#002B5B] border-b border-white/10 px-6 py-2 flex justify-between items-center shrink-0 z-40">
      <div className="flex items-center gap-4 min-w-0"><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><ShieldAlert className="text-[#002B5B]" size={22}/></div><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="text-sm font-black uppercase tracking-tight text-white truncate">{summary.incident?.name ?? 'No Active Incident'}</h1>{summary.incident && <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${alertClass}`}>{summary.incident.alertLevel}</span>}</div><p className="text-[9px] text-white/50 font-mono">Last Sync: {lastSync?.toLocaleTimeString('en-PH') ?? 'Loading...'}</p></div></div>
      <div className="flex items-center gap-5"><div className="hidden md:flex gap-6 border-x border-white/10 px-6">{[['Active Reports',summary.reporting.activeReports.toLocaleString()],['Affected LGUs',`${summary.reporting.affectedLGUs}/${summary.reporting.totalLGUs}`],['Status',summary.incident?.status ?? 'IDLE']].map(([l,v])=><div key={l} className="text-center"><p className="text-[8px] uppercase text-white/40">{l}</p><p className="text-xs font-black text-white">{v}</p></div>)}</div><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/><button onClick={()=>setDark(v=>!v)}>{dark?<Sun size={18} className="text-[#FFB81C]"/>:<Moon size={18} className="text-white"/>}</button></div>
    </header>

    <section className={`grid grid-cols-2 md:grid-cols-4 gap-3 px-3 py-3 shrink-0 ${dark?'bg-[#00111f]':'bg-slate-100'}`}>
      <Scorecard t={t} title="Population Impact" icon={<Users className="text-blue-500" size={15}/>} data={[["Affected",fmt(summary.population.affected)],["Displaced",fmt(summary.population.displaced)]]}/>
      <Scorecard t={t} title="Human Impact" icon={<Activity className="text-red-500" size={15}/>} data={[["Validated Casualties",fmt(summary.humanImpact.casualties)],["Reporting LGUs",`${summary.reporting.affectedLGUs}/${summary.reporting.totalLGUs}`]]}/>
      <Scorecard t={t} title="Infrastructure" icon={<Home className="text-orange-500" size={15}/>} data={[["Damaged",fmt(summary.infrastructure.damaged)],["Cost",money(summary.infrastructure.cost)]]}/>
      <Scorecard t={t} title="Evacuation" icon={<MapPin className="text-emerald-500" size={15}/>} data={[["Centers Reported",fmt(summary.evacuation.centers)],["Evacuees",fmt(summary.evacuation.evacuees)]]}/>
    </section>

    <div className="flex flex-1 overflow-hidden px-3 gap-3 min-h-0">
      <main className={`grow rounded-xl border overflow-hidden flex flex-col ${t.mapBg} ${t.cardBorder}`}>
        <div className={`px-4 py-2 border-b flex items-center justify-between ${t.subheadBg} ${t.subheadBorder}`}><span className={`text-[10px] font-bold uppercase tracking-widest ${t.muted}`}>Iloilo Province — Live Situational Awareness</span><div className="flex gap-2"><button onClick={()=>setShowIncidents(v=>!v)} className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase border ${showIncidents?'bg-[#002B5B] border-[#F37021] text-white':t.select}`}>Affected Areas</button><button onClick={()=>setShowEvac(v=>!v)} className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase border ${showEvac?'bg-[#002B5B] border-[#F37021] text-white':t.select}`}>Evacuation Areas</button></div></div>
        <div className="flex-1 min-h-0"><LiveMap markers={markers} dark={dark} showIncidents={showIncidents} showEvac={showEvac} onMarkerClick={setSelectedMarker}/></div>
      </main>

      <aside className={`w-[310px] lg:w-[340px] rounded-xl border flex flex-col ${t.panelBg} ${t.panelBorder}`}>
        <div className={`px-3 py-2.5 border-b flex items-center gap-2 ${t.subheadBg} ${t.subheadBorder}`}><Bell size={13} className="text-[#F37021]"/><h2 className="text-[10px] font-black uppercase">Advisory & Alerts</h2><span className={`ml-auto text-[9px] ${t.muted}`}>{advisories.length} loaded</span></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">{advisories.length ? advisories.map(a=><AdvisoryCard key={a.id} adv={a} t={t} onClick={()=>setSelectedAdv(a)}/>) : <p className={`text-[10px] p-3 ${t.muted}`}>No external advisories available. Configure PAGASA API access to load PAGASA forecast data.</p>}</div>
      </aside>
    </div>

    <footer className={`h-[26%] mx-3 my-3 rounded-xl border flex flex-col overflow-hidden shrink-0 ${t.panelBg} ${t.panelBorder}`}>
      <div className={`px-4 py-2 border-b flex justify-between items-center ${t.subheadBg} ${t.subheadBorder}`}><h2 className="text-[10px] font-black uppercase flex items-center gap-2 text-[#FFB81C]"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>Live Incident Stream</h2><div className={`flex items-center gap-3 text-[9px] font-mono uppercase ${t.muted}`}><span>{filtered.length} reports</span><select value={sev} onChange={e=>setSev(e.target.value as typeof sev)} className={`border rounded px-1.5 py-0.5 ${t.select}`}><option value="all">All</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div></div>
      <div className="flex-1 overflow-y-auto"><table className="w-full text-left border-collapse min-w-[560px]"><thead className={`sticky top-0 text-[9px] uppercase border-b ${t.subheadBg} ${t.muted}`}><tr><th className="px-4 py-2">Timestamp</th><th className="px-4 py-2">Location</th><th className="px-4 py-2">Description</th><th className="px-4 py-2 text-right">Severity</th></tr></thead><tbody>{filtered.map(i=><tr key={i.id} onClick={()=>setSelectedInc(i)} className={`border-b cursor-pointer ${t.rowBorder} ${t.rowHover}`}><td className={`px-4 py-2 font-mono text-[10px] ${t.muted}`}>{timeAgo(i.time)}</td><td className="px-4 py-2 font-black text-[#F37021] uppercase text-[10px]">{i.town}<div className={`font-normal normal-case ${t.muted}`}>{i.barangay}</div></td><td className={`px-4 py-2 text-[10px] ${t.body}`}>{i.msg}</td><td className={`px-4 py-2 text-right font-bold text-[9px] ${i.severity==='High'?'text-red-500':i.severity==='Medium'?'text-orange-400':'text-emerald-500'}`}>{i.severity}</td></tr>)}{!filtered.length&&<tr><td colSpan={4} className={`text-center py-8 text-[11px] ${t.muted}`}>No incident records for the active incident.</td></tr>}</tbody></table></div>
    </footer>
  </div>;
}
