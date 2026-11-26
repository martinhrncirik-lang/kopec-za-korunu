// Zásady ochrany osobních údajů. Veřejná stránka, odkaz v patičce.
// Při změně toho, co aplikace ze Stravy bere nebo jak dlouho to drží, upravit i tady (API Policy 7.2: uživatele informovat).
export const metadata = { title: 'Soukromí – Kopec za korunu' };

const EMAIL = 'martin.hrncirik@gmail.com';
const UPDATED = '26. 11. 2026';

export default function Privacy() {
  return (
    <>
      <h1>Zásady ochrany osobních údajů</h1>
      <section className="card legal">
        <p className="muted small">Platné od {UPDATED}</p>

        <h2>Kdo tvoje údaje zpracovává</h2>
        <p>
          Správcem je Martin Hrnčiřík, autor aplikace, jako soukromá osoba. Kontakt:{' '}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Aplikace není služba Stravy ani žádné z obdarovaných organizací.
        </p>

        <h2>Co aplikace zpracovává</h2>
        <ul>
          <li><strong>Ze Stravy po tvém souhlasu:</strong> Strava ID, jméno, příjmení, profilový obrázek a tvoje aktivity (kolo a běh včetně trenažéru): druh, datum a čas začátku, vzdálenost, převýšení, čas v pohybu, teplota ze zařízení a místo startu. Přístupové klíče ke Stravě.</li>
          <li><strong>Co zadáš sám:</strong> primárního příjemce daru, jméno do zprávy pro příjemce, režim notifikací, případně vlastní profilový obrázek.</li>
          <li><strong>Technické údaje:</strong> odběr notifikací tvého zařízení a deník technických zpráv od Stravy (čísla aktivit a výsledek zpracování).</li>
        </ul>
        <p>
          Mapu trasy a podrobnosti jízdy aplikace načítá ze Stravy jen ve chvíli, kdy je zobrazuješ, a neukládá je.
          Místo startu se neukládá. Použije se jen jednou, k zjištění teploty (viz níže).
        </p>

        <h2>Proč a na jakém základě</h2>
        <p>
          Aby aplikace mohla dělat to, kvůli čemu ses připojil: sečíst kilometry, poslat měsíční výpis s QR kódem,
          pochválit mimořádnou jízdu a poslat notifikaci. Právním základem je plnění toho, o co jsi požádal
          (čl. 6 odst. 1 písm. b) GDPR). Údaje se nepoužívají k reklamě, profilování, analytice, trénování umělé
          inteligence ani se neprodávají.
        </p>
        <p>
          Tvoje data vidíš jen ty. Autor aplikace kvůli provozu a řešení chyb vidí jména připojených sportovců a jejich
          souhrnná čísla. Aplikace nepřijímá ani nedrží žádné peníze a neví, jestli a komu jsi dar poslal.
        </p>

        <h2>Kdo se k údajům dostane</h2>
        <ul>
          <li><strong>Supabase</strong>: databáze, data uložená ve Frankfurtu (EU).</li>
          <li><strong>Vercel</strong>: provoz aplikace. Vercel je americká firma; předávání se řídí standardními smluvními doložkami EU a rámcem EU-USA pro ochranu údajů.</li>
          <li><strong>Open-Meteo</strong>: pro zjištění teploty během jízdy dostane místo startu zaokrouhlené zhruba na 100 m a čas jízdy, bez jména a jakéhokoli identifikátoru.</li>
          <li><strong>Notifikační služby</strong> výrobce tvého telefonu nebo prohlížeče (Apple, Google, Mozilla) doručují notifikace.</li>
          <li><strong>Strava</strong> je zdrojem dat a samostatným správcem podle svých vlastních zásad.</li>
        </ul>

        <h2>Jak dlouho</h2>
        <p>
          Údaje se uchovávají, dokud máš Kopec propojený se Stravou. Deník technických zpráv se maže nejpozději
          po 90 dnech.
        </p>
        <p>
          Když v Nastavení zvolíš <strong>Odpojit Stravu</strong>, nebo když aplikaci odpojíš přímo ve Stravě
          (Nastavení → Moje aplikace), všechna tvoje data se okamžitě smažou.
        </p>

        <h2>Tvoje práva</h2>
        <p>
          Máš právo na přístup ke svým údajům, jejich opravu, výmaz, omezení zpracování, přenositelnost a právo
          vznést námitku. Stačí napsat na <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Pokud si myslíš, že s údaji
          zacházím špatně, můžeš si stěžovat u Úřadu pro ochranu osobních údajů (<a href="https://uoou.gov.cz" target="_blank" rel="noopener">uoou.gov.cz</a>).
        </p>

        <h2>Změny</h2>
        <p>
          Když se změní, jaké údaje aplikace bere nebo jak s nimi zachází, upravím tuto stránku a dám ti vědět
          v aplikaci.
        </p>
      </section>
      <p><a className="link" href="/">← Zpět</a></p>
    </>
  );
}
