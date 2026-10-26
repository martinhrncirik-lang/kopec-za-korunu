import './globals.css';

export const metadata = {
  title: 'Kopec za korunu',
  description: 'Každý kilometr na kole je koruna pro Nadaci rodiny Vlčkových.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Kopec za korunu', statusBarStyle: 'default' },
};

export const viewport = { themeColor: '#1f5c4a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <header className="top"><a href="/">⛰ Kopec za korunu</a></header>
        <main>{children}</main>
      </body>
    </html>
  );
}
