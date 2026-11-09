import SettingsView from '@/app/components/SettingsView';

// JEN PRO NÁHLED (preview) – před sloučením do main smazat.
// Nastavení s vymyšlenými údaji, aby šlo vidět bez přihlášení. Ukládání tu nefunguje.
export const metadata = { robots: { index: false } };

export default function SettingsDemo() {
  return (
    <>
      <p className="muted small">Ukázka bez přihlášení – změny se neuloží.</p>
      <SettingsView athlete={{ default_recipient: 'nrv', notify_mode: 'svih', payer_name: 'Martin Hrnčiřík', avatar_source: 'none' }} />
    </>
  );
}
