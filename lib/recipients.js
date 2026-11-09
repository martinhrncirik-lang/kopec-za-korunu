// Komu lze darovat. Čísla účtů ověřena 27. 10. 2026 na webech organizací:
//  - Člověk v tísni: clovekvtisni.cz/nase-bankovni-ucty-4610gp – „Hlavní dárcovský účet"
//  - Post Bellum (Paměť národa): postbellum.cz/o-nas/kontakty – „Účet pro dary"
// Nová organizace = nový řádek. IBAN musí sedět s číslem účtu (kontroluje test).
import { DONATION_IBAN, DONATION_ACCOUNT_LABEL } from './config.js';

export const RECIPIENTS = [
  {
    id: 'nrv',
    name: 'Nadace rodiny Vlčkových',
    short: 'NRV',
    forWhom: 'NRV',
    logo: '/logos/nrv.png',
    iban: DONATION_IBAN,
    account: DONATION_ACCOUNT_LABEL,
    useVs: true, // VS = RRMM + ID sportovce, NRV si podle něj páruje platby
    about: 'Pomáhá rodinám s vážně nemocnými dětmi a rozvíjí dětskou paliativní péči v Česku. Takových rodin tu podle posledních výzkumů žije 13 až 15 tisíc. Na pražské Cibulce buduje Centrum pro rodiny s vážně nemocnými dětmi včetně dětského hospice.',
    url: 'https://nrv.org/o-nas/',
  },
  {
    id: 'cvt',
    name: 'Člověk v tísni',
    short: 'Člověk v tísni',
    forWhom: 'Člověka v tísni',
    logo: '/logos/cvt.png',
    logoFill: true, // logo má vlastní barevné pozadí → vyplní celý čtvereček
    iban: 'CZ7603000000000076327632',
    account: '76327632/0300',
    useVs: false,
    about: 'Česká nezisková organizace, která od roku 1992 stojí na straně lidí v nouzi – doma i ve světě.',
    url: 'https://www.clovekvtisni.cz/kdo-jsme/o-nas',
  },
  {
    id: 'pn',
    name: 'Paměť národa (Post Bellum)',
    short: 'Paměť národa',
    forWhom: 'Paměť národa',
    logo: '/logos/pn.png',
    iban: 'CZ6501000000435853660257',
    account: '43-5853660257/0100',
    useVs: false,
    about: 'Post Bellum natáčí vzpomínky lidí, kteří prožili války a totality 20. století. Pomáhá starým lidem i těm, kteří za svoji svobodu právě bojují. Zapomínat je snadné… proto natáčí svědectví, aby nezmizela.',
    url: 'https://magazin.pametnaroda.cz/o-projektu-pamet-naroda',
  },
];

export function getRecipient(id) {
  return RECIPIENTS.find((r) => r.id === id) || RECIPIENTS[0];
}

// Příjemce pro tento dar: volba v adrese (?pro=…) má přednost, jinak primární příjemce ze Nastavení.
export function pickRecipientId(queryPro, athlete) {
  if (RECIPIENTS.some((r) => r.id === queryPro)) return queryPro;
  return getRecipient(athlete?.default_recipient).id;
}

// Jen veřejné údaje pro prohlížeč (bez čísel účtů z konfigurace).
export const RECIPIENT_CHOICES = RECIPIENTS.map(({ id, name }) => ({ id, name }));
