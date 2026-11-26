'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Pozná, že uživatel přešel na jinou stránku v rámci aplikace (pak má „Zpět“ smysl vracet v historii).
export default function NavTracker() {
  const path = usePathname();
  const first = useRef(path);
  useEffect(() => {
    if (path !== first.current) { try { sessionStorage.setItem('kzk-inapp', '1'); } catch {} }
  }, [path]);
  return null;
}
