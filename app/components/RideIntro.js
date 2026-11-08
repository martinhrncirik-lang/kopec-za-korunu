'use client';

import { useEffect, useState } from 'react';
import RideIntroPhone from './RideIntroPhone';
import RideIntroWide from './RideIntroWide';

// Úvodní animace: podle šířky obrazovky vybere rozložení.
// Telefon (< 768 px): text uprostřed, krajina dole – Martin 8. 11.: „na mobil jsou dobře rozložené".
// Monitor (≥ 768 px): krajina do dvou třetin, cíl vpravo, panel vyjede vlevo až pod horní text.
export const WIDE_FROM = 768;

export default function RideIntro(props) {
  const [layout, setLayout] = useState(null);
  useEffect(() => { setLayout(window.innerWidth >= WIDE_FROM ? 'wide' : 'phone'); }, []);
  if (!layout) return null;
  return layout === 'wide' ? <RideIntroWide {...props} /> : <RideIntroPhone {...props} />;
}
