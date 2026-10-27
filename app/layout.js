import '@fontsource-variable/bricolage-grotesque/wdth.css';
import './globals.css';

export const metadata = {
  title: 'Kopec za korunu',
  description: 'Každý kilometr na kole je koruna na dobrou věc.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Kopec za korunu', statusBarStyle: 'default' },
};

export const viewport = { themeColor: '#004225', width: 'device-width', initialScale: 1 };

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
      </body>
    </html>
  );
}
