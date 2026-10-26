// Veškeré nastavení se bere z Environment Variables ve Vercelu.
// Nic citlivého nepatří přímo do kódu.

export const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

// Kolik Kč za 1 km. Zadání: 1 km = 1 Kč.
export const RATE_CZK_PER_KM = Number(process.env.RATE_CZK_PER_KM || 1);

// Účet pro dary ve formátu IBAN (QR Platba vyžaduje IBAN).
// 663939/0300 = CZ7103000000000000663939
export const DONATION_IBAN = process.env.DONATION_IBAN || '';
// Lidsky čitelné číslo účtu pro zobrazení pod QR kódem.
export const DONATION_ACCOUNT_LABEL = process.env.DONATION_ACCOUNT_LABEL || '';

// Strava mění v lednu 2027 základní URL API (https://api-v3.strava.com).
// Až to nastane, stačí změnit proměnnou STRAVA_API_BASE.
export const STRAVA_API = process.env.STRAVA_API_BASE || 'https://www.strava.com/api/v3';
export const STRAVA_OAUTH = 'https://www.strava.com/oauth';

// Které typy aktivit se počítají. Elektrokola a virtuální jízdy záměrně ne.
// Úprava = změna tohoto seznamu.
export const SPORT_GROUPS = {
  ride: ['Ride', 'GravelRide', 'MountainBikeRide'],
  run: ['Run', 'TrailRun'],
};

export function sportGroup(sportType) {
  for (const [group, types] of Object.entries(SPORT_GROUPS)) {
    if (types.includes(sportType)) return group;
  }
  return null;
}
