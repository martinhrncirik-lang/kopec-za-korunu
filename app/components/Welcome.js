// Jednorázová uvítací obrazovka po prvním přihlášení – filozofie Kopce (Martin vybral delší verzi, 10. 11.).
export default function Welcome({ name, acceptAction = '/api/welcome', leaveAction = '/api/welcome/leave' }) {
  return (
    <section className="welcome">
      <img src="/logo.svg" alt="" className="welcome-coin" />
      <h1>Ahoj{name ? ` ${name}` : ''}, vítej na Kopci.</h1>
      <p className="welcome-lead">Kopec za korunu je pro ty, kdo rádi jezdí a občas se o tu radost podělí s někým, komu se nedaří.</p>
      <p>Nemusí to být moc ani často. Někdy pošleš celý měsíc, někdy polovinu, někdy nic. Jen ne nikdy.</p>
      <form action={acceptAction} method="post"><button className="btn block">Jdu do toho</button></form>
      <form action={leaveAction} method="post" className="welcome-leave muted small">
        Nesedí ti to? V pohodě, <button className="link">odpojit</button> a nic se neuloží.
      </form>
    </section>
  );
}
