'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { introTexts } from '@/lib/praise-fun';

// Úvodní animace po otevření jízdy (?intro=1 poprvé, ?intro=2 vždy).
// 1) Krajina vyplní spodní dvě třetiny obrazovky, jezdec vyjede k cíli (praporek / pohár /
//    kilometrovník) u pravého okraje; vršek symbolu končí ve dvou třetinách výšky.
// 2) Nahoře vlevo se napočítají kilometry. 3) Zespodu připluje průsvitný panel s pochvalou,
//    ironickým komentářem, mincí, částkou a větou o vděku – až těsně pod horní text,
//    vlevo vedle cíle, takže symbol zůstane vidět.
// Geometrie se počítá z velikosti obrazovky, takže sedí na telefonu i na monitoru.
// Klepnutím lze kdykoli přeskočit. Při „omezit pohyb" se nezobrazí vůbec.

const TOTAL_MS = 7800; // po této době se sama odsune
const EXIT_MS = 550;

function useCountUp(target, start, duration, run) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf, t0;
    const tick = (t) => {
      if (t0 === undefined) t0 = t;
      const p = Math.min(1, Math.max(0, (t - t0 - start) / duration));
      setV(target * (1 - Math.pow(1 - p, 3))); // ease-out
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration, run]);
  return v;
}

// Deterministické „náhodné" číslo 0–1.
const rnd = (i, n) => ((Math.sin((i + 1) * n) * 10000) % 1 + 1) % 1;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const r1 = (v) => Math.round(v * 10) / 10;

const COINS = Array.from({ length: 22 }, (_, i) => {
  const angle = rnd(i, 12.9898) * Math.PI * 2;
  const dist = 80 + rnd(i, 78.233) * 130;
  return {
    x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 30,
    size: 9 + rnd(i, 39.425) * 14, delay: rnd(i, 4.1) * 160, spin: (rnd(i, 9.7) - 0.5) * 720,
  };
});
const FLAKES = Array.from({ length: 44 }, (_, i) => ({
  left: rnd(i, 3.3) * 100, size: 3 + rnd(i, 7.7) * 5, dur: 4 + rnd(i, 5.1) * 5, delay: -rnd(i, 2.9) * 8, drift: (rnd(i, 6.1) - 0.5) * 60,
}));

const poly = (pts) => pts.map(([x, y]) => `L${r1(x)} ${r1(y)}`).join(' ');
// Hladká křivka přes body (Catmull-Rom → Bézier).
function smooth(pts) {
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r1(c1[0])} ${r1(c1[1])}, ${r1(c2[0])} ${r1(c2[1])}, ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

// Celá scéna v pixelech obrazovky (viewBox = 0 0 W H).
function buildScene(W, H, terrain, finish, label) {
  const k = clamp(H / 300, 1.5, 3.2);                 // měřítko symbolu v cíli
  const markerH = finish === 'flag' ? 26 : 30;          // výška symbolu v jednotkách
  // Kolik zabírá symbol vlevo a vpravo od paty (v jednotkách před zvětšením).
  const stoneHalf = Math.max(20, label.length * 5.4 + 8) / 2;
  const [extL, extR] = finish === 'flag' ? [2, 18] : finish === 'stone' ? [stoneHalf, stoneHalf] : [14, 14];
  // Monitor: cíl daleko vpravo a panel vyjede vlevo vedle něj až pod horní text.
  // Telefon: cíl vpravo od středu a panel vyjede od spodního okraje pod symbol.
  const wide = W >= 768;
  const fx = wide ? Math.min(W - extR * k - 40, W / 2 + 420) : W / 2 + clamp(0.16 * W, 50, 260);
  const panelLeft = wide ? Math.max(16, W / 2 - 300) : Math.max(0, (W - 520) / 2);
  const panelRight = wide ? Math.min(panelLeft + 560, fx - extL * k - 24) : panelLeft + Math.min(W, 520);
  const fy = H / 3 + markerH * k;                       // vršek symbolu = dvě třetiny odspodu
  const N = Math.max(6, Math.round(W / 90));
  const [lo, hi] = terrain === 'climb' ? [0.55, 0.7] : [0.47, 0.62];
  const backPts = Array.from({ length: N + 1 }, (_, i) => [-40 + (i * (W + 80)) / N, H * (lo + (hi - lo) * rnd(i, 3.7))]);
  const back = `M-40 ${H + 40} ${poly(backPts)} L${W + 40} ${H + 40} Z`;

  let front, road;
  if (terrain === 'climb') {
    const hw = Math.min(0.36 * W, 0.5 * H), base = 0.88 * H;
    const width = (y) => Math.max(0, (hw * (y - fy)) / (base - fy));
    const left = [0.25, 0.5, 0.75].map((t, i) => [lerp(fx - hw, fx, t) + (rnd(i, 5.3) - 0.5) * 0.05 * hw, lerp(base, fy, t) + (rnd(i, 8.1) - 0.5) * 0.03 * H]);
    const right = [0.75, 0.5, 0.25].map((t, i) => [lerp(fx + hw * 0.9, fx, t) + (rnd(i, 2.2) - 0.5) * 0.05 * hw, lerp(base - 0.02 * H, fy, t) + (rnd(i, 6.6) - 0.5) * 0.03 * H]);
    front = `M-40 ${H + 40} ${poly([[-40, 0.9 * H], [fx - hw * 1.3, 0.9 * H], [fx - hw, base], ...left, [fx, fy], ...right, [fx + hw * 0.9, base - 0.02 * H], [fx + hw * 1.3, 0.9 * H], [W + 40, 0.91 * H]])} L${W + 40} ${H + 40} Z`;
    const n = 6;
    const pts = Array.from({ length: n + 1 }, (_, j) => {
      const y = lerp(H + 20, fy, j / n);
      if (j === 0) return [fx - hw * 0.45, y];
      if (j === n) return [fx, fy];
      return [fx + (j % 2 ? 1 : -1) * width(y) * 0.55, y];
    });
    road = smooth(pts);
  } else {
    const footY = 0.84 * H;
    const ridge = (x) => fy + (footY - fy) * Math.pow(1 - clamp((x + 40) / (fx + 40), 0, 1), 1.3);
    const left = [0.2, 0.4, 0.6, 0.8].map((t, j) => { const x = lerp(-40, fx, t); return [x, ridge(x) + (j % 2 ? -1 : 1) * 0.015 * H * (1 - t)]; });
    front = `M-40 ${H + 40} ${poly([[-40, footY], ...left, [fx, fy], [fx + 0.07 * W, fy + 0.05 * H], [fx + 0.16 * W, fy + 0.11 * H], [fx + 0.26 * W, fy + 0.09 * H], [W + 40, fy + 0.2 * H]])} L${W + 40} ${H + 40} Z`;
    const pts = [0, 0.3, 0.55, 0.8, 1].map((t) => { const x = lerp(0.04 * W, fx, t); return [x, Math.min(H + 20, ridge(x) + 0.22 * H * Math.pow(1 - t, 1.2))]; });
    road = smooth(pts);
  }
  const sun = { x: Math.min(fx + 0.22 * W, W - 50), y: 0.5 * H, r: clamp(0.07 * Math.min(W, H), 26, 60) };
  return { W, H, k, fx, fy, back, front, road, sun, panelLeft, panelRight, wide };
}

function Finish({ type, label }) {
  if (type === 'cup') {
    return (
      <g className="ri-pop">
        <rect x="-7" y="-4" width="14" height="4" rx="1" fill="#c38f1d" />
        <rect x="-2" y="-13" width="4" height="9" fill="#e3b341" />
        <path d="M-10 -30 h20 v5 a10 10 0 0 1 -20 0 Z" fill="#f6d571" />
        <path d="M-10 -27 h-4 a5 5 0 0 0 5 8 M10 -27 h4 a5 5 0 0 1 -5 8" fill="none" stroke="#e3b341" strokeWidth="2" />
      </g>
    );
  }
  if (type === 'stone') {
    const w = Math.max(20, label.length * 5.4 + 8);
    return (
      <g className="ri-pop">
        <rect x={-w / 2} y="-30" width={w} height="30" rx="4" fill="#f6ead0" />
        <path d={`M${-w / 2} -26 a4 4 0 0 1 4 -4 h${w - 8} a4 4 0 0 1 4 4 v5 h${-w} Z`} fill="#e3b341" />
        <text x="0" y="-8" textAnchor="middle" fontSize="9" fontWeight="800" fill="#05480d" fontFamily="system-ui, sans-serif">{label}</text>
      </g>
    );
  }
  return (
    <g className="ri-pop">
      <line x1="0" y1="0" x2="0" y2="-26" stroke="#f6ead0" strokeWidth="2" />
      <path d="M0 -26 L18 -21 L0 -16 Z" fill="#e3b341" />
    </g>
  );
}

// Pamatuje si (v tomto zařízení), které aktivity už animaci viděly.
const SEEN_KEY = 'kzk-intro-seen';
function alreadySeen(id) {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]').includes(String(id)); } catch { return false; }
}
function markSeen(id) {
  try {
    const list = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]').filter((x) => x !== String(id));
    list.push(String(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify(list.slice(-300)));
  } catch {}
}

// always = přehrát i podruhé (odkaz „Přehrát animaci", ukázka); jinak jen při prvním otevření aktivity.
export default function RideIntroWide({ km, elevation, praise, strong, amount, forWhom, isRun, seed, variant, always = false }) {
  const [phase, setPhase] = useState('check'); // check | play | exit | done
  const [geo, setGeo] = useState(null);
  const [panelTop, setPanelTop] = useState(null);
  const timer = useRef();
  const topRef = useRef();
  const t = introTexts({ praise, isRun, seed, variant });
  const { terrain, finish, mood } = t.scene;
  const stoneLabel = t.kind === 'milestone' ? (t.milestone || '1000').replace(/\s/g, '') : isRun ? '21,1' : '100';

  useEffect(() => {
    // Adresu bez ?intro=…, ať se animace neopakuje po obnovení stránky nebo návratu zpět.
    const url = new URL(window.location.href);
    if (url.searchParams.has('intro')) {
      url.searchParams.delete('intro');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    const seen = alreadySeen(seed);
    if (seed != null) markSeen(seed);
    if ((seen && !always) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }
    setGeo(buildScene(window.innerWidth, window.innerHeight, terrain, finish, stoneLabel));
    setPhase('play'); // animace se vykreslí až teď, takže začne od začátku
    document.body.style.overflow = 'hidden';
    timer.current = setTimeout(() => setPhase('exit'), TOTAL_MS);
    const buzz = setTimeout(() => navigator.vibrate?.([30, 60, 30]), 4300); // Android; iPhone ignoruje
    return () => { clearTimeout(timer.current); clearTimeout(buzz); document.body.style.overflow = ''; };
  }, []);

  // Panel vyjede až těsně pod horní text (jeho výšku známe až po vykreslení).
  useLayoutEffect(() => {
    if (phase === 'play' && topRef.current) setPanelTop(topRef.current.offsetTop + topRef.current.offsetHeight + 14);
  }, [phase, geo]);

  useEffect(() => {
    if (phase === 'exit') {
      document.body.style.overflow = '';
      const tm = setTimeout(() => setPhase('done'), EXIT_MS);
      return () => clearTimeout(tm);
    }
  }, [phase]);

  const kmShown = useCountUp(km, 600, 1700, phase === 'play');
  const elevShown = useCountUp(elevation, 800, 1600, phase === 'play');

  if (phase === 'done' || phase === 'check' || !geo) return null;

  const skip = () => { clearTimeout(timer.current); setPhase('exit'); };
  const fmt1 = (n) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const cls = ['ride-intro', geo?.wide ? 'wide' : 'narrow', `kind-${t.kind}`, `terrain-${terrain}`, mood && `mood-${mood}`, strong && 'strong', phase === 'exit' && 'exit'];
  const { W, H, k, fx, fy, panelLeft, panelRight, wide } = geo;

  return (
    <div className={cls.filter(Boolean).join(' ')} onClick={skip} role="dialog" aria-label={t.headline}>
      {mood === 'snow' && (
        <div className="ri-snow" aria-hidden="true">
          {FLAKES.map((f, i) => (
            <span key={i} style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, '--drift': `${f.drift}px` }} />
          ))}
        </div>
      )}

      <svg className="ri-scene" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" style={{ '--rise': `${Math.round(H * 0.12)}px`, '--sunrise': `${Math.round(H * 0.18)}px` }}>
        {mood === 'dawn' && <circle className="ri-sun" cx={geo.sun.x} cy={geo.sun.y} r={geo.sun.r} />}
        <path className="ri-hill-back" d={geo.back} />
        <path className="ri-hill-front" d={geo.front} />
        <path id="ri-road" className="ri-road" d={geo.road} pathLength="100" style={{ strokeWidth: (terrain === 'climb' ? 2.4 : 3.2) * k * 0.65 }} />
        <g className="ri-rider">
          <g transform={`scale(${r1(k * 0.75)})`}>
            <circle r="7" fill="#f6d571" />
            <circle r="3" fill="#05480d" />
          </g>
          <animateMotion dur="1.9s" begin="0.5s" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.25 1">
            <mpath href="#ri-road" />
          </animateMotion>
        </g>
        <g transform={`translate(${r1(fx)} ${r1(fy)}) scale(${r1(k)})`}>
          <Finish type={finish} label={stoneLabel} />
        </g>
      </svg>

      {mood === 'dust' && (
        <>
          <div className="ri-gray" aria-hidden="true" />
          <svg className="ri-web left" viewBox="0 0 100 100" aria-hidden="true">
            <g fill="none" stroke="rgba(255,255,255,.55)" strokeWidth=".8">
              <path d="M0 0 L100 35 M0 0 L80 80 M0 0 L35 100 M0 0 L100 0 M0 0 L0 100" />
              <path d="M30 0 Q 26 12 28 10 Q 24 22 20 20 Q 12 26 10 28 Q 6 30 0 30" />
              <path d="M60 0 Q 54 22 56 20 Q 48 42 40 40 Q 26 52 20 56 Q 12 58 0 60" />
              <path d="M90 0 Q 82 30 84 31 Q 70 62 60 60 Q 40 78 31 84 Q 18 86 0 90" />
            </g>
          </svg>
          <svg className="ri-web right" viewBox="0 0 100 100" aria-hidden="true">
            <g fill="none" stroke="rgba(255,255,255,.45)" strokeWidth=".8">
              <path d="M0 0 L100 35 M0 0 L80 80 M0 0 L35 100 M0 0 L100 0 M0 0 L0 100" />
              <path d="M45 0 Q 40 18 42 16 Q 34 32 30 30 Q 18 40 15 42 Q 8 44 0 45" />
              <path d="M80 0 Q 72 28 74 28 Q 62 56 54 54 Q 36 68 28 74 Q 14 76 0 80" />
            </g>
          </svg>
        </>
      )}

      {/* Nahoře vlevo: nadpis a kilometry – napočítávají se během jízdy */}
      <div className="ri-top" ref={topRef} style={wide ? { left: panelLeft + 4 } : undefined}>
        <p className="ri-headline">{t.headline}</p>
        <p className="ri-km"><span>{fmt1(kmShown)}</span> km</p>
        {elevation >= 50 && <p className="ri-elev">↑ {Math.round(elevShown).toLocaleString('cs-CZ')} m stoupání</p>}
        {t.kind === 'streak' && t.streak > 0 && (
          <p className="ri-days" aria-hidden="true">
            {Array.from({ length: t.streak }, (_, i) => <span key={i} style={{ animationDelay: `${0.9 + i * (1.1 / t.streak)}s` }} />)}
          </p>
        )}
      </div>

      {/* Zespodu připluje panel se zbytkem: monitor – až pod horní text vlevo od cíle; telefon – pod cíl */}
      <div className="ri-panel" style={wide
        ? { left: panelLeft, width: panelRight - panelLeft, top: panelTop ?? fy }
        : { left: panelLeft, width: panelRight - panelLeft, maxHeight: Math.max(240, H - fy - 14) }}>
        {praise && <p className="ri-praise">{strong ? '⭐ ' : ''}{praise}</p>}
        <p className="ri-quip">{t.quip}</p>
        <div className="ri-coin-wrap">
          <div className="ri-glow" />
          <div className="ri-burst" aria-hidden="true">
            {COINS.map((c, i) => (
              <span key={i} style={{ '--x': `${c.x}px`, '--y': `${c.y}px`, '--s': `${c.size}px`, '--d': `${c.delay}ms`, '--r': `${c.spin}deg` }} />
            ))}
          </div>
          <img className="ri-coin" src="/logo.svg" alt="" />
        </div>
        <p className="ri-amount">{amount.toLocaleString('cs-CZ')} Kč pro {forWhom}</p>
        <p className="ri-sub">{t.gratitude}</p>
      </div>

      <p className="ri-skip" style={wide ? { left: panelLeft, width: panelRight - panelLeft } : { left: 0, right: 0 }}>Klepnutím pokračovat</p>
    </div>
  );
}
