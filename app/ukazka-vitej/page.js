import Welcome from '@/app/components/Welcome';

// JEN PRO NÁHLED – před sloučením do main smazat. Tlačítka tu nic neudělají.
export const metadata = { robots: { index: false } };

export default function WelcomeDemo() {
  return <Welcome name="Petře" acceptAction="/ukazka-vitej" leaveAction="/ukazka-vitej" />;
}
