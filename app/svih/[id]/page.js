import { notFound, redirect } from 'next/navigation';
import { db, getAthlete } from '@/lib/db';
import { currentAthleteId } from '@/lib/session';
import { RATE_CZK_PER_KM } from '@/lib/config';
import { variableSymbol } from '@/lib/spayd';
import { fmtKm } from '@/lib/stats';
import { validToken, getActivity } from '@/lib/strava';
import DonationCard from '@/app/components/DonationCard';
import ShareButton from '@/app/components/ShareButton';
import RouteMap from '@/app/components/RouteMap';
import { pickRecipientId } from '@/lib/recipients';

export const dynamic = 'force-dynamic';

const kmh = (ms) => (ms * 3.6).toLocaleString('cs-CZ', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
function duration(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}
const SPORT = { Ride: 'Jízda', GravelRide: 'Gravel', MountainBikeRide: 'MTB', Run: 'Běh', TrailRun: 'Trailový běh' };

// Detail aktivity: data se při zobrazení načtou živě ze Stravy (nic navíc se neukládá),
// pochvala za švih a QR na dar za tuto jízdu.
export default async function Svih({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  const athleteId = await currentAthleteId();
  if (!athleteId) redirect('/');

  const { data: a } = await db()
    .from('activities')
    .select('*')
    .eq('strava_id', id)
    .eq('athlete_id', athleteId) // cizí aktivity neukazujeme
    .maybeSingle();
  if (!a) notFound();

  // Živá data ze Stravy; když Strava neodpoví, ukážeme aspoň to, co máme v databázi.
  const athlete = await getAthlete(athleteId);
  let s = null;
  try {
    s = await getActivity(await validToken(athlete), id);
  } catch (e) {
    console.error('activity detail', e);
  }

  const distance = s?.distance ?? Number(a.distance_m);
  const moving = s?.moving_time ?? a.moving_time_s;
  const elevation = s?.total_elevation_gain ?? Number(a.elevation_m);
  const avgSpeed = s?.average_speed ?? (moving ? distance / moving : 0);
  const isRun = ['Run', 'TrailRun'].includes(a.sport_type);
  const pace = (ms) => { const spk = 1000 / ms; return `${Math.floor(spk / 60)}:${String(Math.round(spk % 60)).padStart(2, '0')} /km`; };

  const stats = [
    ['Vzdálenost', `${fmtKm(distance / 1000)} km`],
    ['Čas v pohybu', duration(moving)],
    [isRun ? 'Ø tempo' : 'Ø rychlost', isRun ? pace(avgSpeed) : `${kmh(avgSpeed)} km/h`],
    ['Převýšení', `${Math.round(elevation)} m`],
  ];
  if (s?.max_speed && !isRun) stats.push(['Max. rychlost', `${kmh(s.max_speed)} km/h`]);
  if (s?.elapsed_time && s.elapsed_time > moving) stats.push(['Celkový čas', duration(s.elapsed_time)]);
  if (s?.average_heartrate) stats.push(['Ø tep', `${Math.round(s.average_heartrate)} bpm`]);
  if (s?.max_heartrate) stats.push(['Max. tep', `${Math.round(s.max_heartrate)} bpm`]);
  if (s?.average_watts) stats.push([s.device_watts ? 'Ø výkon' : 'Ø výkon (odhad)', `${Math.round(s.average_watts)} W`]);
  if (s?.kilojoules) stats.push(['Práce', `${Math.round(s.kilojoules)} kJ`]);
  if (s?.elev_high != null) stats.push(['Nejvyšší bod', `${Math.round(s.elev_high)} m n. m.`]);

  const date = new Date(a.start_local + 'Z').toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const time = a.start_local.slice(11, 16);

  const km = distance / 1000;
  const isDouble = sp?.x === '2';
  const amount = Math.round(km * RATE_CZK_PER_KM) * (isDouble ? 2 : 1);

  return (
    <>
      <p className="muted small activity-meta">{SPORT[a.sport_type] || a.sport_type} · {date}, {time}</p>
      <h1 className="activity-title">{s?.name || 'Aktivita'}</h1>

      {a.praise && (
        <section className="card praise-card">
          <p className="praise">⭐ {a.praise}</p>
        </section>
      )}

      <h2 className="donation-title first">Dar za tuto jízdu: {amount.toLocaleString('cs-CZ')} Kč</h2>
      <p className="muted small">Navíc k měsíčnímu výpisu. Měsíční výpis ho neodečítá.</p>
      <DonationCard
        amount={amount}
        vs={variableSymbol(a.month, athleteId)}
        message={`Kopec za korunu ${a.start_local.slice(0, 10)}`}
        basePath={`/svih/${id}`}
        isDouble={isDouble}
        recipientId={pickRecipientId(sp?.pro, athlete)}
        defaultId={pickRecipientId(null, athlete)}
      />

      <h2 className="section-title">Detail jízdy</h2>
      <section className="card activity-card">
        <RouteMap polyline={s?.map?.summary_polyline} />
        <dl className="stats-grid">
          {stats.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <a className="strava-link" href={`https://www.strava.com/activities/${id}`} target="_blank" rel="noopener">
          Zobrazit na Stravě
        </a>
      </section>

      <ShareButton text={`${a.praise ? a.praise + ' ' : `${fmtKm(km)} km na kole. `}Každý kilometr = koruna na dobrou věc.`} />
      <p><a className="link" href="/">← Zpět</a></p>
    </>
  );
}
