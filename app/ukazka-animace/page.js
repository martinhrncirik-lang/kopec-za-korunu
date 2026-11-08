import RideIntro from '@/app/components/RideIntro';

// Jen pro náhled animace na testovací větvi: bez přihlášení, ukázková data.
// Před sloučením do produkce smazat.
export const dynamic = 'force-dynamic';

const SAMPLES = {
  alltime:   { label: 'Rekord všech dob', km: 152.3, elev: 1180, praise: 'Nejdelší jízda v historii: 152,3 km, o 12,1 km víc než dosavadní osobní maximum (140,2 km).' },
  hundred:   { label: 'Stovka', km: 104.2, elev: 860, praise: 'Stovka! 104,2 km v jednom zátahu. Už 3. letos.' },
  hundredRun:{ label: 'Půlmaraton', km: 21.4, elev: 120, run: true, praise: 'Půlmaraton: 21,4 km.' },
  climb1000: { label: 'Přes 1 000 m', km: 68.5, elev: 1240, praise: 'Přes tisíc výškových metrů: 1 240 m na jedné jízdě.' },
  long12:    { label: 'Nejdelší za 12 týdnů', km: 72.4, elev: 540, praise: 'Nejdelší jízda za posledních 12 týdnů: 72,4 km, o 12,4 km víc než dosavadní maximum (60 km).' },
  climb12:   { label: 'Nejvíc nahoru za 12 týdnů', km: 48.1, elev: 910, praise: 'Největší převýšení za posledních 12 týdnů: 910 m, o 410 m víc než dosud (500 m).' },
  streak:    { label: 'Série dní', km: 31.6, elev: 280, praise: '5 dní v řadě na kole. Série trvá od 4. 11.' },
  milestone: { label: 'Tisícovka za rok', km: 42.0, elev: 390, praise: 'Letos už 3 000 km. To je 3 000 Kč na dobrou věc.' },
  winter:    { label: 'Mráz (slabší)', km: 27.8, elev: 210, weak: true, praise: 'Jízda při -2 °C. Tohle se počítá dvakrát, aspoň morálně.' },
  early:     { label: 'Ranní ptáče (slabší)', km: 35.2, elev: 300, weak: true, praise: 'Start v 5:40. Kilometry před snídaní.' },
  comeback:  { label: 'Návrat po pauze (slabší)', km: 22.5, elev: 150, weak: true, praise: 'Zpátky v sedle po 19 dnech. Vítejte zpět.' },
  none:      { label: 'Bez pochvaly', km: 24.3, elev: 180, weak: true, praise: null },
};

export default async function Ukazka({ searchParams }) {
  const sp = await searchParams;
  const typ = SAMPLES[sp?.typ] ? sp.typ : 'hundred';
  const v = Number(sp?.v) || 0; // jiná verze vtipu
  const s = SAMPLES[typ];
  const link = (k, vv = 0) => `/ukazka-animace?typ=${k}${vv ? `&v=${vv}` : ''}`;
  return (
    <>
      <h1>Ukázka animace</h1>
      <p className="muted">Klepni na typ pochvaly. Vtipy mají 2–3 verze, „jiný vtip“ ukáže další. Ve skutečnosti dostane každá jízda jednu verzi napevno.</p>
      <ul className="months">
        {Object.entries(SAMPLES).map(([k, x]) => (
          <li key={k}><a href={link(k)}>{k === typ ? '▶ ' : ''}{x.label}</a></li>
        ))}
      </ul>
      <p><a className="btn ghost" href={link(typ, v + 1)}>Jiný vtip</a> <a className="btn ghost" href={link(typ, v)}>Přehrát znovu</a></p>
      <RideIntro
        key={`${typ}-${v}`}
        km={s.km} elevation={s.elev} praise={s.praise} strong={!s.weak && !!s.praise}
        amount={Math.round(s.km)} forWhom="NRV" isRun={!!s.run} seed="ukazka" variant={v} always
      />
    </>
  );
}
