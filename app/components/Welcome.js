// Jednorázová uvítací obrazovka po prvním přihlášení – filozofie Kopce (text: Martin, 10. 11.).
export default function Welcome({ name, acceptAction = '/api/welcome', leaveAction = '/api/welcome/leave' }) {
  return (
    <section className="welcome">
      <img src="/logo.svg" alt="" className="welcome-coin" />
      <h1>Vítej na Kopci{name ? `, ${name}` : ''}.</h1>
      <p className="welcome-lead">Jezdíš pro radost a občas se o ni podělíš. Ne nutně moc, ne nutně často, ale ne nikdy.</p>
      <form action={acceptAction} method="post"><button className="btn block">Platí</button></form>
      <form action={leaveAction} method="post" className="welcome-leave muted small">
        Nesedí ti to? V pohodě, <button className="link">odpojit</button> a nic se neuloží.
      </form>
    </section>
  );
}
