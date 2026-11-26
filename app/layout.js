import Link from 'next/link';
import '@fontsource-variable/bricolage-grotesque/wdth.css';
import './globals.css';
import NavTracker from './components/NavTracker';

export const metadata = {
  title: 'Kopec za korunu',
  description: 'Každý kilometr na kole je koruna na dobrou věc.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Kopec za korunu', statusBarStyle: 'default' },
};

export const viewport = { themeColor: '#05480d', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>
        <NavTracker />
        <header className="top">
          <Link href="/" className="brand">
            <img src="/icon.svg" alt="" className="brand-mark" />
            <span className="brand-word">Kopec <span>za korunu</span></span>
          </Link>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <nav><Link href="/o-aplikaci">O aplikaci</Link> · <Link href="/soukromi">Soukromí</Link> · <Link href="/podminky">Podmínky</Link></nav>
          <img className="powered-strava" src="/strava/api_logo_pwrdBy_strava_horiz_orange.svg" alt="Powered by Strava" />
        </footer>
      </body>
    </html>
  );
}
