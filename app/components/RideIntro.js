'use client';

import { useEffect, useRef, useState } from 'react';

// Úvodní animace po kliknutí na notifikaci o jízdě (?intro=1).
// Kopec se nakreslí, cyklista vyjede nahoru, napočítají se kilometry, přijde pochvala
// a nakonec zlatá mince s částkou. Klepnutím lze kdykoli přeskočit.
// Respektuje „omezit pohyb" v telefonu – pak se nezobrazí vůbec.

const TOTAL_MS = 5600; // po této době se sama odsune
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

// Deterministické „náhodné" rozházení mincí (stejné na serveru i v prohlížeči).
const COINS = Array.from({ length: 22 }, (_, i) => {
  const r = (n) => ((Math.sin((i + 1) * n) * 10000) % 1 + 1) % 1;
  const angle = r(12.9898) * Math.PI * 2;
  const dist = 90 + r(78.233) * 150;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist - 40,
    size: 10 + r(39.425) * 16,
    delay: r(4.1) * 160,
    spin: (r(9.7) - 0.5) * 720,
  };
});

export default function RideIntro({ km, elevation, praise, strong, amount, forWhom, isRun }) {
  const [phase, setPhase] = useState('play'); // play | exit | done
  const timer = useRef();

  useEffect(() => {
    // Adresu bez ?intro=1, ať se animace neopakuje po obnovení stránky nebo návratu zpět.
    const url = new URL(window.location.href);
    url.searchParams.delete('intro');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }
    document.body.style.overflow = 'hidden';
    timer.current = setTimeout(() => setPhase('exit'), TOTAL_MS);
    const buzz = setTimeout(() => navigator.vibrate?.([30, 60, 30]), 3150); // Android; iPhone ignoruje
    return () => { clearTimeout(timer.current); clearTimeout(buzz); document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      document.body.style.overflow = '';
      const t = setTimeout(() => setPhase('done'), EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const kmShown = useCountUp(km, 700, 1500, phase === 'play');
  const elevShown = useCountUp(elevation, 900, 1400, phase === 'play');

  if (phase === 'done') return null;

  const skip = () => { clearTimeout(timer.current); setPhase('exit'); };
  const fmt1 = (n) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const headline = strong ? 'Tohle byl švih!' : praise ? 'Dobrá práce!' : `${isRun ? 'Doběhnuto' : 'Dojeto'}!`;

  return (
    <div className={`ride-intro${phase === 'exit' ? ' exit' : ''}${strong ? ' strong' : ''}`} onClick={skip} role="dialog" aria-label={headline}>
      <div className="ri-glow" />

      {/* Kopec, silnice a jezdec */}
      <svg className="ri-hill" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path className="ri-hill-back" d="M0 220 L0 150 L90 110 L160 135 L250 70 L330 105 L400 85 L400 220 Z" />
        <path className="ri-hill-front" d="M0 220 L0 185 L70 160 L140 172 L230 118 L300 140 L400 120 L400 220 Z" />
        <path id="ri-road" className="ri-road" pathLength="100" d="M10 205 C 80 190, 110 180, 150 168 S 215 128, 232 120" />
        <g className="ri-rider">
          <circle r="7" fill="#f6d571" />
          <circle r="3" fill="#05480d" />
          <animateMotion dur="1.9s" begin="0.55s" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.25 1">
            <mpath href="#ri-road" />
          </animateMotion>
        </g>
        <g className="ri-flag">
          <line x1="232" y1="120" x2="232" y2="94" stroke="#f6ead0" strokeWidth="2" />
          <path d="M232 94 L250 99 L232 104 Z" fill="#e3b341" />
        </g>
      </svg>

      <div className="ri-content">
        <p className="ri-headline">{headline}</p>
        <p className="ri-km"><span>{fmt1(kmShown)}</span> km</p>
        {elevation >= 50 && <p className="ri-elev">↑ {Math.round(elevShown).toLocaleString('cs-CZ')} m stoupání</p>}
        {praise && <p className="ri-praise">{strong ? '⭐ ' : ''}{praise}</p>}

        <div className="ri-coin-wrap">
          <div className="ri-burst" aria-hidden="true">
            {COINS.map((c, i) => (
              <span
                key={i}
                style={{
                  '--x': `${c.x}px`, '--y': `${c.y}px`, '--s': `${c.size}px`,
                  '--d': `${c.delay}ms`, '--r': `${c.spin}deg`,
                }}
              />
            ))}
          </div>
          <img className="ri-coin" src="/logo.svg" alt="" />
        </div>
        <p className="ri-amount">{amount.toLocaleString('cs-CZ')} Kč pro {forWhom}</p>
        <p className="ri-sub">Kilometry jsou v nohách. Teď můžou pomáhat.</p>
      </div>

      <p className="ri-skip">Klepnutím pokračovat</p>
    </div>
  );
}
