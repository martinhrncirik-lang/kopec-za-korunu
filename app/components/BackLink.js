'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// „← Zpět“: když jsme na stránku přišli z aplikace, vrátí se v historii (okamžitě, z paměti prohlížeče).
// Když byla stránka otevřená napřímo (třeba z notifikace), vede na hlavní stránku.
export default function BackLink({ href = '/', children = '← Zpět' }) {
  const router = useRouter();
  return (
    <Link
      className="link"
      href={href}
      onClick={(e) => {
        let inApp = false;
        try { inApp = sessionStorage.getItem('kzk-inapp') === '1'; } catch {}
        if (inApp && window.history.length > 1) { e.preventDefault(); router.back(); }
      }}
    >
      {children}
    </Link>
  );
}
