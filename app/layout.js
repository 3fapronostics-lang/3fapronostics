import './globals.css';
import { AuthProvider } from '../lib/AuthContext';
import Nav from '../components/Nav';

export const metadata = {
  title: '3FAPronostics',
  description: 'Pronostics football américain français — Ligue Élite, Division 1, Division 2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Nav />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
