// Podmínky používání. Veřejná stránka, odkaz v patičce.
import Link from 'next/link';
import BackLink from '@/app/components/BackLink';
export const metadata = { title: 'Podmínky – Kopec za korunu' };

const EMAIL = 'martin.hrncirik@gmail.com';
const UPDATED = '26. 11. 2026';

export default function Terms() {
  return (
    <>
      <h1>Podmínky používání</h1>
      <section className="card legal">
        <p className="muted small">Platné od {UPDATED}</p>

        <h2>O co jde</h2>
        <p>
          Kopec za korunu je bezplatná aplikace, kterou jako soukromý projekt provozuje Martin Hrnčiřík. Z tvých
          aktivit na Stravě spočítá kilometry (1 km = 1 Kč), jednou za měsíc ti pošle výpis s QR kódem a občas
          pochválí mimořádnou jízdu.
        </p>

        <h2>Dary</h2>
        <p>
          Darovat je dobrovolné. Aplikace žádné peníze nevybírá, nepřijímá ani nedrží. Dar posíláš svou bankou
          přímo na účet organizace, kterou si vybereš. Za správnost platby, potvrzení o daru a jeho daňové
          uplatnění odpovídá příslušná organizace a ty. QR kód před odesláním vždy zkontroluj v bance.
        </p>

        <h2>Strava</h2>
        <p>
          Aplikace používá rozhraní Stravy se tvým souhlasem. Není službou Stravy a Strava ji nesponzoruje ani
          neschvaluje. Používáním Stravy dál platí její vlastní podmínky. Přístup můžeš kdykoli zrušit v Nastavení
          aplikace nebo ve Stravě.
        </p>

        <h2>Bez záruky</h2>
        <p>
          Aplikace je poskytovaná tak, jak je. Může se stát, že některá aktivita nedorazí, výpis přijde později
          nebo pochvala vůbec. Provoz může být kdykoli omezen nebo ukončen, třeba když Strava změní podmínky
          přístupu.
        </p>

        <h2>Používání</h2>
        <p>
          Aplikaci nepoužívej způsobem, který by škodil ostatním, aplikaci nebo Stravě. Při zneužití může být
          přístup zrušen.
        </p>

        <h2>Kontakt</h2>
        <p>
          Dotazy a připomínky na <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Jak aplikace zachází s údaji, popisují{' '}
          <Link href="/soukromi">zásady ochrany osobních údajů</Link>.
        </p>
      </section>
      <p><BackLink /></p>
    </>
  );
}
