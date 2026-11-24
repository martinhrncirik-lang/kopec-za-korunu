import HomeView from '../components/HomeView';

// Jen pro náhled na větvi (na Vercel Preview se nedá přihlásit). Před sloučením do main smazat.
export default function Ukazka() {
  const athlete = { firstname: 'Martin', default_recipient: 'nrv', avatar_url: null };
  const recent = [
    { strava_id: 1, start_local: '2026-11-23T07:10:00', distance_m: 42300, praise: 'x', praise_strong: true },
    { strava_id: 2, start_local: '2026-11-21T17:00:00', distance_m: 28100, praise: null },
    { strava_id: 3, start_local: '2026-11-18T06:40:00', distance_m: 55600, praise: 'x', praise_strong: false },
    { strava_id: 4, start_local: '2026-11-15T09:00:00', distance_m: 81200, praise: null },
  ];
  return (
    <HomeView
      athlete={athlete} month="2026-11" km={312.4} count={9} czk={312}
      recent={recent} months={['2026-10', '2026-09']} last={null} lastMonth="2026-10" verdict={null}
    />
  );
}
