'use client';

import { useEffect, useRef, useState } from 'react';
import { introTexts } from '@/lib/praise-fun';

// Úvodní animace po kliknutí na notifikaci o jízdě (?intro=1).
// Každý druh pochvaly má vlastní scénu (kopec / hora se serpentinami, svítání, sníh,
// pavučina po pauze, kilometrovník, pohár) a k věcné pochvale ironickou poznámku
// a větu o vděku. Pak zlatá mince s částkou. Klepnutím lze kdykoli přeskočit.
// Při „omezit pohyb" v telefonu se nezobrazí vůbec.

const TOTAL_MS = 7400; // po této době se sama odsune
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

// Deterministické „náhodné" číslo (stejné na serveru i v prohlížeči).
const rnd = (i, n) => ((Math.sin((i + 1) * n) * 10000) % 1 + 1) % 1;

const COINS = Array.from({ length: 22 }, (_, i) => {
  const angle = rnd(i, 12.9898) * Math.PI * 2;
  const dist = 90 + rnd(i, 78.233) * 150;
  return {
    x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 40,
    size: 10 + rnd(i, 39.425) * 16, delay: rnd(i, 4.1) * 160, spin: (rnd(i, 9.7) - 0.5) * 720,
  };
});
const FLAKES = Array.from({ length: 40 }, (_, i) => ({
  left: rnd(i, 3.3) * 100, size: 3 + rnd(i, 7.7) * 5, dur: 4 + rnd(i, 5.1) * 5, delay: -rnd(i, 2.9) * 8, drift: (rnd(i, 6.1) - 0.5) * 60,
}));

// Krajina sahá daleko do stran a škáluje se podle výšky (meet), takže se na širokém
// displeji nic neuřízne: místo zvětšení se jen ukáže víc kopců vedle. Silnice začíná
// pod spodním okrajem, takže vždy přijíždí „odněkud".
const TERRAIN = {
  distance: {
    back: 'M-1400 260 L-1400 120 L-1200 120 L-1040 95 L-900 130 L-780 100 L-660 120 L-560 85 L-450 125 L-350 95 L-260 130 L-170 90 L-80 120 L0 150 L90 110 L160 135 L250 70 L330 105 L400 85 L480 115 L560 80 L650 120 L740 95 L840 125 L950 90 L1060 120 L1200 100 L1340 125 L1500 95 L1800 95 L1800 260 Z',
    front: 'M-1400 260 L-1400 170 L-1200 170 L-1020 180 L-880 165 L-760 182 L-640 168 L-520 185 L-420 165 L-320 180 L-230 160 L-140 185 L-60 170 L0 185 L70 160 L140 172 L230 118 L300 140 L400 120 L470 150 L540 135 L620 165 L700 150 L800 172 L900 155 L1000 175 L1120 160 L1260 178 L1450 162 L1800 162 L1800 260 Z',
    road: 'M-20 236 C 60 205, 110 182, 150 168 S 215 128, 232 120',
    finish: [232, 120],
  },
  climb: {
    back: 'M-1400 260 L-1400 152 L-1200 152 L-980 165 L-820 148 L-680 166 L-560 150 L-440 168 L-330 145 L-240 165 L-150 140 L-70 160 L0 172 L60 150 L120 165 L310 140 L360 152 L400 146 L470 165 L550 140 L640 160 L740 135 L860 165 L980 148 L1120 166 L1300 150 L1500 162 L1800 162 L1800 260 Z',
    front: 'M-1400 260 L-1400 200 L-1200 200 L-1000 205 L-760 198 L-560 206 L-420 196 L-300 205 L-180 190 L-80 200 L0 205 L110 178 L200 36 L290 165 L400 195 L480 190 L580 200 L700 192 L860 204 L1050 196 L1300 203 L1500 198 L1800 198 L1800 260 Z',
    road: 'M10 236 C 70 214, 140 197, 150 182 C 160 170, 120 168, 150 150 C 175 136, 215 140, 205 122 C 195 106, 165 108, 180 92 C 192 80, 215 78, 205 64 C 198 54, 196 46, 200 38',
    finish: [200, 38],
  },
};

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
export default function RideIntro({ km, elevation, praise, strong, amount, forWhom, isRun, seed, variant, always = false }) {
  const [phase, setPhase] = useState('check'); // check | play | exit | done
  const timer = useRef();
  const t = introTexts({ praise, isRun, seed, variant });
  const { terrain, finish, mood } = t.scene;
  const land = TERRAIN[terrain];

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
    setPhase('play'); // animace se vykreslí až teď, takže začne od začátku
    document.body.style.overflow = 'hidden';
    timer.current = setTimeout(() => setPhase('exit'), TOTAL_MS);
    const buzz = setTimeout(() => navigator.vibrate?.([30, 60, 30]), 3700); // Android; iPhone ignoruje
    return () => { clearTimeout(timer.current); clearTimeout(buzz); document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      document.body.style.overflow = '';
      const tm = setTimeout(() => setPhase('done'), EXIT_MS);
      return () => clearTimeout(tm);
    }
  }, [phase]);

  const kmShown = useCountUp(km, 700, 1500, phase === 'play');
  const elevShown = useCountUp(elevation, 900, 1400, phase === 'play');

  if (phase === 'done' || phase === 'check') return null;

  const skip = () => { clearTimeout(timer.current); setPhase('exit'); };
  const fmt1 = (n) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const stoneLabel = t.kind === 'milestone' ? (t.milestone || '1000').replace(/\s/g, '') : isRun ? '21,1' : '100';
  const cls = ['ride-intro', `kind-${t.kind}`, `terrain-${terrain}`, mood && `mood-${mood}`, strong && 'strong', phase === 'exit' && 'exit'];

  return (
    <div className={cls.filter(Boolean).join(' ')} onClick={skip} role="dialog" aria-label={t.headline}>
      <div className="ri-glow" />

      {mood === 'snow' && (
        <div className="ri-snow" aria-hidden="true">
          {FLAKES.map((f, i) => (
            <span key={i} style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, '--drift': `${f.drift}px` }} />
          ))}
        </div>
      )}

      <svg className="ri-hill" viewBox="40 0 320 220" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        {mood === 'dawn' && <circle className="ri-sun" cx="305" cy="66" r="26" />}
        <path className="ri-hill-back" d={land.back} />
        <path className="ri-hill-front" d={land.front} />
        <path id="ri-road" className="ri-road" d={land.road} pathLength="100" />
        <g className="ri-rider">
          <circle r="7" fill="#f6d571" />
          <circle r="3" fill="#05480d" />
          <animateMotion dur="1.9s" begin="0.55s" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.25 1">
            <mpath href="#ri-road" />
          </animateMotion>
        </g>
        <g transform={`translate(${land.finish[0]} ${land.finish[1]})`}>
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

      <div className="ri-content">
        <p className="ri-headline">{t.headline}</p>
        <p className="ri-km"><span>{fmt1(kmShown)}</span> km</p>
        {elevation >= 50 && <p className="ri-elev">↑ {Math.round(elevShown).toLocaleString('cs-CZ')} m stoupání</p>}
        {t.kind === 'streak' && t.streak > 0 && (
          <p className="ri-days" aria-hidden="true">
            {Array.from({ length: t.streak }, (_, i) => <span key={i} style={{ animationDelay: `${0.9 + i * (1.1 / t.streak)}s` }} />)}
          </p>
        )}
        {praise && <p className="ri-praise">{strong ? '⭐ ' : ''}{praise}</p>}
        <p className="ri-quip">{t.quip}</p>

        <div className="ri-coin-wrap">
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

      <p className="ri-skip">Klepnutím pokračovat</p>
    </div>
  );
}
