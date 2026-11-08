// Texty a scény pro úvodní animaci (RideIntro).
// Pochvala z lib/stats.js je věcná a podložená čísly; tady k ní patří nadhled:
// trochu ironie, ať si nikdo nemyslí, že je mistr světa, a vděk, že vůbec může jezdit.

// Druh pochvaly z jejího textu (v databázi je jen text, sloupec navíc by chtěl migraci).
// Musí sedět s texty v lib/stats.js – hlídá to test. Staré texty (vykání, „Stovka!") v databázi zůstávají, proto obě varianty.
export function kindFromText(text) {
  if (!text) return 'none';
  if (/^Nejdelší (jízda v historii|jízda, jakou máte|jízda, jakou máš)/.test(text)) return 'alltime';
  if (/^(Gran Fondo!|Stovka!|Půlmaraton)/.test(text)) return 'hundred';
  if (/^Přes tisíc výškových/.test(text)) return 'climb1000';
  if (/^Nejdelší .* za posledních 12 týdnů/.test(text)) return 'long12';
  if (/^Největší převýšení/.test(text)) return 'climb12';
  if (/dní v řadě/.test(text)) return 'streak';
  if (/^Letos už/.test(text)) return 'milestone';
  if (/°C/.test(text)) return 'winter';
  if (/^Start v/.test(text)) return 'early';
  if (/^Zpátky/.test(text)) return 'comeback';
  return 'none';
}

// terrain: 'distance' (dlouhé vlny) | 'climb' (vysoká hora se serpentinami)
// mood: null | 'dawn' (svítání) | 'snow' (sníh) | 'dust' (pavučina)
// finish: 'flag' | 'stone' (kilometrovník) | 'cup' (pohár)
export const SCENES = {
  alltime:   { terrain: 'distance', finish: 'cup' },
  hundred:   { terrain: 'distance', finish: 'stone' },
  climb1000: { terrain: 'climb', finish: 'flag' },
  long12:    { terrain: 'distance', finish: 'flag' },
  climb12:   { terrain: 'climb', finish: 'flag' },
  streak:    { terrain: 'distance', finish: 'flag' },
  milestone: { terrain: 'distance', finish: 'stone' },
  winter:    { terrain: 'distance', finish: 'flag', mood: 'snow' },
  early:     { terrain: 'distance', finish: 'flag', mood: 'dawn' },
  comeback:  { terrain: 'distance', finish: 'flag', mood: 'dust' },
  none:      { terrain: 'distance', finish: 'flag' },
};

export function headline(kind, text, isRun) {
  const streak = text?.match(/^(\d+) dní v řadě/)?.[1];
  return {
    alltime: 'Osobní rekord!',
    hundred: isRun ? 'Půlmaraton!' : 'Gran Fondo!',
    climb1000: 'Tisíc metrů nahoru!',
    long12: 'Nejdál za 12 týdnů!',
    climb12: 'Nejvýš za 12 týdnů!',
    streak: streak ? `${streak} dní v řadě!` : 'Série!',
    milestone: 'Další tisícovka!',
    winter: 'Mráz nemráz!',
    early: 'Ranní ptáče!',
    comeback: isRun ? 'Zpátky v botách!' : 'Zpátky v sedle!',
    none: isRun ? 'Doběhnuto!' : 'Dojeto!',
  }[kind];
}

// Ironie a nadhled. Dvě až tři verze na druh, ať se to neokouká.
// Cyklistická slovní zásoba (watty, výkon, tepovka, kadence, káva, preso, cappuccino,
// tlaky v pneu) – vždy s nadsázkou, nikdy jako vážná rada. Tykání, bez rodu.
const QUIPS = {
  alltime: [
    'Rekord všech dob. Tedy tvých dob. Profíci zatím spí klidně.',
    'Nejdál, kam tě kdy kolo dovezlo. Watty možná nebyly světové, ale vydržely.',
    'Tour de France se zatím neozvala. Zkontroluj tlaky v pneu a čekej dál.',
  ],
  hundred: [
    'Zní to italsky a vznešeně. Zadek to vnímá spíš česky.',
    'Italové by si teď dali preso. Ty si dej rovnou dvě. A k nim dobrý pocit z daru.',
    'Profíci tomu říkají regenerační vyjížďka. Jenže oni mají plat a kávu zdarma.',
  ],
  hundredRun: [
    'Ta druhá půlka maratonu počká. Klidně do příštího roku.',
    'Tepovka chvíli volala o pomoc. Teď si zaslouží cappuccino.',
  ],
  climb1000: [
    'Výtah by to dal za tři minuty. Ale ten pocit by ti nedal.',
    'Tepovka si teď píše deník a kadence žádá o dovolenou.',
    'Kilometr svisle. Kolena se k tomu vyjádří písemně.',
  ],
  long12: [
    'Rekord čtvrtletí. Účetně vzato výborný kvartál.',
    'Nejdelší za tři měsíce. Tlaky v pneu vydržely. Ty taky.',
    'Laťka možná nebyla vysoko. Ale watty na ni stačily.',
  ],
  climb12: [
    'Nejvíc nahoru za tři měsíce. Kopce o tom zatím nevědí.',
    'Rekordní stoupání. Dolů to naštěstí jede samo. Rovnou ke kávě.',
    'Kadence klesla, tepovka stoupla, výškoměr se usmívá.',
  ],
  streak: [
    'Gauč se začíná ptát, co udělal špatně.',
    'Nejtěžší bude zítra. Stravě se nedá nic nalhat.',
    'Tolik dní v řadě. Barista už ví, co si dáš.',
  ],
  milestone: [
    'Tachometr je hrdý, peněženka trochu nervózní.',
    'Tisíc kilometrů. V přepočtu zhruba čtyřicet zastávek na kafe.',
    'Auto by to dalo za den. Ale nikomu by tím nepomohlo.',
  ],
  winter: [
    'Rozumní lidé se na tohle dívali z okna. S hrnkem čaje.',
    'Prsty si to budou pamatovat déle než ty. Až rozmrznou u cappuccina.',
    'V mrazu klesá tlak v pneu a stoupá respekt okolí. Fyzika je neúprosná.',
  ],
  early: [
    'Slunce vstávalo kvůli tobě. Kohout má konkurenci.',
    'Kavárny ještě měly zavřeno. O to čistší výkon.',
    'Kadence před snídaní, preso až po ní. Správné pořadí.',
  ],
  comeback: [
    'Kolo už se bálo, že skončí v bazaru.',
    'Forma se hned nevrátí. Watty taky ne. Ale tohle byl první krok.',
    'Nejdřív dofouknout pneu, pak sebe. Obojí se povedlo.',
  ],
  comebackRun: [
    'Boty už se bály, že skončí v kontejneru.',
    'Forma se hned nevrátí, tepovka to potvrdí. Ale tohle byl první krok.',
  ],
  none: [
    'Žádný rekord. Jen obyčejná jízda. I ta se počítá.',
    'Watty průměrné, nálada nadprůměrná. To se taky počítá.',
    'Nebyl to švih, ale kilometry jsou kilometry. A káva po nich je stejně zasloužená.',
  ],
  noneRun: [
    'Žádný rekord. Jen obyčejný běh. I ten se počítá.',
    'Tempo průměrné, nálada nadprůměrná. To se taky počítá.',
    'Nebyl to švih, ale kilometry jsou kilometry. A káva po nich je stejně zasloužená.',
  ],
};

// Vděk: přechod od výkonu k daru. Tykání a bez rodu (minulý čas by musel být „jel/jela").
const GRATITUDE = [
  'Mít čím šlapat a kde jezdit je výhra. Ne každý ji dostal.',
  'Zdravé nohy nejsou samozřejmost. Dnes dostaly pořádně zabrat.',
  'Někdo dnes do kopce nevyjede. Ty mu můžeš aspoň trochu pomoct.',
  'Káva po vyjížďce je zasloužená. Dar k ní taky.',
];
const GRATITUDE_RUN = [
  'Mít čím běžet a kde běhat je výhra. Ne každý ji dostal.',
  'Zdravé nohy nejsou samozřejmost. Dnes dostaly pořádně zabrat.',
  'Někdo dnes ani nevyjde schody. Ty mu můžeš aspoň trochu pomoct.',
  'Káva po běhu je zasloužená. Dar k ní taky.',
];

// Stejná aktivita = vždy stejná verze (seed = ID aktivity). variant = napevno (jen ukázka).
function pick(list, seed, salt, variant) {
  if (variant != null) return list[variant % list.length];
  let h = 2166136261;
  for (const ch of `${seed}:${salt}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return list[(h >>> 0) % list.length];
}

export function introTexts({ praise, isRun, seed, variant }) {
  const kind = kindFromText(praise);
  const runKey = isRun && QUIPS[kind + 'Run'] ? kind + 'Run' : kind;
  return {
    kind,
    scene: SCENES[kind],
    headline: headline(kind, praise, isRun),
    quip: pick(QUIPS[runKey], seed, 'q', variant),
    gratitude: pick(isRun ? GRATITUDE_RUN : GRATITUDE, seed, 'g', variant),
    streak: Number(praise?.match(/^(\d+) dní v řadě/)?.[1]) || 0,
    milestone: praise?.match(/^Letos už ([\d\s ]+) km/)?.[1]?.trim() || null,
  };
}

export const ALL_QUIPS = QUIPS; // pro ukázkovou stránku
