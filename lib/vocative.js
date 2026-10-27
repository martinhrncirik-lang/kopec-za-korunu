// Oslovení v 5. pádě pro běžná česká jména. Neumí všechno, ale Martin bude Martine.
const EXCEPTIONS = {
  Daniel: 'Danieli', Michael: 'Michaeli', Samuel: 'Samueli', Emanuel: 'Emanueli',
  Petr: 'Petře', Alexandr: 'Alexandře', Leandr: 'Leandře',
  Josef: 'Josefe', Kryštof: 'Kryštofe',
};

export function vocative(name) {
  if (!name) return '';
  const n = name.trim().split(/\s+/)[0];
  if (EXCEPTIONS[n]) return EXCEPTIONS[n];
  const lower = n.toLowerCase();
  if (/[^aeiouyáéíóúůý]r$/.test(lower)) return n.slice(0, -1) + 'ře'; // Petr → Petře
  if (lower.endsWith('ek')) return n.slice(0, -2) + 'ku';               // Marek → Marku
  if (lower.endsWith('el')) return n.slice(0, -2) + 'le';               // Pavel → Pavle
  if (lower.endsWith('a')) return n.slice(0, -1) + 'o';                 // Jana → Jano, Honza → Honzo
  if (/[šžčřcj]$/.test(lower)) return n + 'i';                         // Tomáš → Tomáši, Ondřej → Ondřeji
  if (/[aeiouyáéíóúůý]$/.test(lower)) return n;                         // Jiří, Lucie
  return n + 'e';                                                       // Martin → Martine
}
