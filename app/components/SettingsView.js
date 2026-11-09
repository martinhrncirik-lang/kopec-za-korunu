import AvatarSettings from '@/app/components/AvatarSettings';
import PushButton from '@/app/components/PushButton';
import RecipientSettings from '@/app/components/RecipientSettings';
import PayerNameSetting from '@/app/components/PayerNameSetting';
import NotifyModeSetting from '@/app/components/NotifyModeSetting';
import { RECIPIENT_CHOICES, getRecipient } from '@/lib/recipients';

const AVATAR_LABEL = { strava: 'ze Stravy', custom: 'vlastní', none: 'bez obrázku' };
const NOTIFY_LABEL = { svih: 'jen švihy a výpis', all: 'po každé jízdě', monthly: 'jen měsíční výpis' };

// Sbalitelná položka nastavení: v zavřeném stavu jen název a aktuální hodnota.
function Item({ title, value, children }) {
  return (
    <details className="card setting">
      <summary>
        <span className="setting-title">{title}</span>
        <span className="setting-value muted small">{value}</span>
      </summary>
      <div className="setting-body">{children}</div>
    </details>
  );
}

export default function SettingsView({ athlete }) {
  const r = getRecipient(athlete.default_recipient);
  return (
    <>
      <h1>Nastavení</h1>
      <Item title="Komu daruji" value={r.short}>
        <p className="muted small">Primární příjemce je předvybraný u měsíčního výpisu i u každé jízdy. U konkrétního daru ho můžeš vždy změnit.</p>
        <RecipientSettings choices={RECIPIENT_CHOICES} initial={r.id} />
      </Item>
      <Item title="Notifikace" value={NOTIFY_LABEL[athlete.notify_mode || 'svih']}>
        <PushButton />
        <NotifyModeSetting initial={athlete.notify_mode || 'svih'} />
      </Item>
      <Item title="Jméno ve zprávě pro příjemce" value={athlete.payer_name || 'anonymně'}>
        <p className="muted small">Objeví se v platbě, aby organizace věděla, od koho dar je (třeba kvůli potvrzení o daru). Když ho necháš prázdné, dar bude anonymní.</p>
        <PayerNameSetting initial={athlete.payer_name || ''} />
      </Item>
      <Item title="Profilový obrázek" value={AVATAR_LABEL[athlete.avatar_source || 'strava']}>
        <AvatarSettings
          initialSource={athlete.avatar_source}
          stravaUrl={athlete.strava_avatar_url}
          customUrl={athlete.avatar_url}
        />
      </Item>
      <p className="muted small">Změna se uloží hned, hodnota v záhlaví položky se obnoví po načtení stránky.</p>
      <p><a className="link" href="/">← Zpět</a></p>
    </>
  );
}
