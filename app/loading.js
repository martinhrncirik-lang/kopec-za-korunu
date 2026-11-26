// Okamžitá odezva při přechodu mezi stránkami: než server stránku připraví (dotazy na Stravu),
// ukáže se tohle. Platí pro všechny stránky bez vlastního loading.js.
export default function Loading() {
  return (
    <div className="page-loading" role="status" aria-label="Načítám">
      <img src="/icon.svg" alt="" className="page-loading-coin" />
      <p className="muted small">Šlapu pro data…</p>
    </div>
  );
}
