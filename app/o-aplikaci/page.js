// Stránka o aplikaci a jejím autorovi. Veřejná, bez přihlášení.
export const metadata = { title: 'O aplikaci – Kopec za korunu' };

const PHOTO = '/o-aplikaci/martin.jpg';
const EMAIL = 'martin.hrncirik@gmail.com';

export default function About() {
  return (
    <>
      <h1>O aplikaci</h1>
      <section className="card about">
        {PHOTO && (
          <figure className="about-photo">
            <img src={PHOTO} alt="Martin s helmou v davu cyklistů na Critical Mass" />
            <figcaption className="muted small">Na Critical Mass, společné jízdě ulicemi města</figcaption>
          </figure>
        )}
        <p>
          Ahoj, jsem Martin. Jezdím na kole a Kopec za korunu jsem postavil proto, aby z mých kilometrů
          bylo i něco dobrého pro ostatní. A když už to funguje mně, může to fungovat i tobě.
        </p>
        <p>
          Aby bylo jasno: pracuju v Nadaci rodiny Vlčkových, jedné z organizací, kterým tu můžeš darovat.
          Komu dar pošleš, je ale jen na tobě.
        </p>
        <p>
          Kopec za korunu je můj soukromý projekt. Aplikace žádné peníze nevybírá ani nedrží. Dar posíláš
          svou bankou rovnou na účet organizace, kterou si vybereš. Ze Stravy aplikace bere jen tvoje
          aktivity, aby spočítala kilometry.
        </p>
        <p>
          Nápad, chyba, nebo jen pozdrav? Napiš mi na <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
      </section>
      <p><a className="link" href="/">← Zpět</a></p>
    </>
  );
}
