# Kopec za korunu

Každý kilometr ze Stravy = 1 Kč pro Nadaci rodiny Vlčkových (NRV).
Webová aplikace (PWA): Next.js na Vercelu, databáze Supabase, data ze Strava API přes webhook.

## Co umí verze 0.1

- přihlášení přes Stravu, po přihlášení se stáhne posledních 12 týdnů (kvůli statistikám),
- nová aktivita na Stravě → webhook → uložení → push notifikace („+42 km, tento měsíc 347 Kč"),
- **mimořádný švih** → pochvala podložená čísly + QR na dar za tu jízdu (stránka `/svih/<id>`),
- **1. den v měsíci** push s odkazem na výpis za minulý měsíc (`/vypis/RRRR-MM`),
- výpis s QR Platbou, tlačítko **2× dar** vygeneruje nový QR s dvojnásobkem,
- sdílení a pozvánky přes systémové menu telefonu.

Počítají se: Ride, GravelRide, MountainBikeRide, Run, TrailRun. Elektrokola a virtuální jízdy ne
(úprava v `lib/config.js`, `SPORT_GROUPS`).

Variabilní symbol: **RRMM + ID sportovce na 6 míst** (říjen 2026, sportovec 1 → `2610000001`).

Pravidla pro pochvalu (`lib/stats.js`), vyhodnocují se v tomto pořadí:
1. první jízda ≥ 100 km (běh ≥ 21,1 km) v kalendářním roce,
2. nejdelší aktivita stejného druhu za posledních 12 týdnů (min. 5 předchozích aktivit pro srovnání),
3. největší převýšení za 12 týdnů (a zároveň aspoň 300 m).

## Nasazení (kroky 6–8)

### 1. Databáze
Supabase → **SQL Editor** → New query → vložit obsah `supabase/schema.sql` → **Run**.

### 2. Kód do GitHubu
Repozitář `kopec-za-korunu` → **Add file → Upload files** → přetáhnout obsah této složky
(bez `node_modules` a `.next`, pokud by tam byly) → **Commit changes**.

### 3. Vercel
**Add New → Project** → vybrat `kopec-za-korunu` → **Deploy**. Framework se pozná sám (Next.js).
První nasazení skončí chybou nebo nebude fungovat, protože chybí proměnné. To je v pořádku.
Zapamatujte si přidělenou adresu, např. `https://kopec-za-korunu.vercel.app`.

### 4. Proměnné prostředí
Vercel → projekt → **Settings → Environment Variables**. Vložte vše z `.env.example`:

| Proměnná | Odkud |
|---|---|
| `APP_URL` | adresa z Vercelu, bez lomítka na konci |
| `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` | strava.com/settings/api |
| `SUPABASE_URL` | Supabase → Project Settings → API (nebo Data API) → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | tamtéž, **secret** klíč (dříve „service_role"), ne publishable/anon |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SESSION_SECRET`, `CRON_SECRET`, `STRAVA_VERIFY_TOKEN` | soubor `tajne-hodnoty.txt` (dodán zvlášť) |
| `VAPID_CONTACT`, `DONATION_IBAN`, `DONATION_ACCOUNT_LABEL`, `RATE_CZK_PER_KM` | hodnoty z `.env.example` |

Pak **Deployments → … → Redeploy**, aby se proměnné načetly.

### 5. Strava
strava.com/settings/api → **Authorization Callback Domain** změnit z `localhost`
na doménu z Vercelu **bez https://**, např. `kopec-za-korunu.vercel.app`.

### 6. Registrace webhooku (jednou)
V terminálu (Windows: Příkazový řádek, `curl` je součástí systému), vše na jednom řádku:

```
curl -X POST https://www.strava.com/api/v3/push_subscriptions -F client_id=VAŠE_CLIENT_ID -F client_secret=VÁŠ_SECRET -F callback_url=https://kopec-za-korunu.vercel.app/api/strava/webhook -F verify_token=HODNOTA_STRAVA_VERIFY_TOKEN
```

Odpověď `{"id": 123456}` = hotovo. Číslo vložte do Vercelu jako `STRAVA_SUBSCRIPTION_ID` a znovu Redeploy.
Strava povoluje jeden webhook na aplikaci; kontrola: stejný příkaz s `-G` místo `-X POST` a bez `callback_url`/`verify_token`.

### 7. Test
1. Otevřít aplikaci na telefonu → **Připojit přes Stravu** → povolit.
2. **Zapnout notifikace.** Na iPhonu nejdřív Sdílet → Přidat na plochu a otevřít z plochy.
3. Nahrát nebo projet aktivitu. Do pár vteřin má přijít notifikace.
4. Otevřít `/vypis/<aktuální měsíc>`, naskenovat QR v bance, zkontrolovat účet, částku a VS. Nezaplatit, pokud nechcete.

Měsíční výpis lze vyzkoušet ručně: Vercel → **Settings → Cron Jobs → Run**.

## Co je potřeba vyřešit před spuštěním pro další lidi

- **Ukládání dat.** API Policy Stravy (od 1. 6. 2026) omezuje cache na 7 dní. Aplikace drží u aktivit jen čísla
  (datum, km, převýšení, čas) kvůli měsíčnímu součtu a 12týdenním statistikám. Před review u Stravy ověřit,
  zda to projde, případně ukládat jen měsíční součty a maxima.
- **Branding.** Pro review Strava vyžaduje oficiální tlačítko „Connect with Strava" a „Powered by Strava".
- **Sponzoři, kteří nejezdí.** Zobrazovat data sportovce někomu jinému podmínky zakazují. Řešit až po konzultaci znění API Agreement.
- **Vercel Hobby** je jen pro osobní/nekomerční použití. Pod hlavičkou NRV počítat s tarifem Pro.
- **GDPR, potvrzení o daru, párování plateb** – nadační strana, kód je neřeší.
- **API URL.** Strava mění v lednu 2027 základní adresu API; pak nastavit `STRAVA_API_BASE`.

## Vývoj

```
npm install
npm test        # testy QR, VS a pravidel pochval
npm run dev     # lokálně na http://localhost:3000 (s .env.local)
```
