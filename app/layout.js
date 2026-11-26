import '@fontsource-variable/bricolage-grotesque/wdth.css';
import './globals.css';

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
        <header className="top">
          <a href="/" className="brand">
            <img src="/icon.svg" alt="" className="brand-mark" />
            <span className="brand-word">Kopec <span>za korunu</span></span>
          </a>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <nav><a href="/o-aplikaci">O aplikaci</a> · <a href="/soukromi">Soukromí</a> · <a href="/podminky">Podmínky</a></nav>
          <img className="powered-strava" src="/strava/api_logo_pwrdBy_strava_horiz_orange.svg" alt="Powered by Strava" />
        </footer>
      </body>
    </html>
  );
}
