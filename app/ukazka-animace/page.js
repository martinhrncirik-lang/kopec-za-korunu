import RideIntro from '@/app/components/RideIntro';

// Jen pro náhled animace na testovací větvi, bez přihlášení a s ukázkovými daty.
// ?typ=slabsi = slabší pochvala, ?typ=bez = bez pochvaly. Obnovením stránky se přehraje znovu.
export const dynamic = 'force-dynamic';
export default async function Ukazka({ searchParams }) {
  const typ = (await searchParams)?.typ;
  const praise = typ === 'bez' ? null : typ === 'slabsi'
    ? 'Start v 5:40. Kilometry před snídaní.'
    : 'Nejdelší jízda za posledních 12 týdnů: 112,4 km, o 18,6 km víc než dosavadní maximum (93,8 km).';
  return (
    <>
      <h1>Ukázka animace</h1>
      <p className="muted">Obnovením stránky se přehraje znovu.</p>
      <p><a className="link" href="/ukazka-animace">Silná pochvala</a> · <a className="link" href="/ukazka-animace?typ=slabsi">Slabší</a> · <a className="link" href="/ukazka-animace?typ=bez">Bez pochvaly</a></p>
      <RideIntro key={typ || 'silna'} km={112.4} elevation={1320} praise={praise} strong={!typ} amount={112} forWhom="NRV" isRun={false} />
    </>
  );
}
