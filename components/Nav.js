'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flame, Users, CalendarDays, Shield, Trophy, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

const TABS = [
  { href: '/', label: 'Pronostics', icon: Flame },
  { href: '/classement-divisions', label: 'Classement divisions', icon: Users },
  { href: '/resultats', label: 'Résultats', icon: CalendarDays },
  { href: '/classement-equipes', label: 'Classement équipes', icon: Shield },
  { href: '/classement-joueurs', label: 'Classement joueurs', icon: Trophy },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 bg-[#0A1F44]/90 backdrop-blur">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded" />
          <span className="condensed font-semibold tracking-wide text-lg">
            3FA<span className="text-[#EF4135]">PRONOSTICS</span>
          </span>
        </Link>
        {!loading && (
          user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/equipes"
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-[#2B4A82] text-[#B7C1DA]"
              >
                <ImageIcon size={13} /> Équipes
              </Link>
              <span className="mono text-xs text-[#EF4135] hidden sm:inline">{user.email}</span>
              <button
                onClick={logout}
                className="text-xs px-2.5 py-1 rounded-full border border-[#2B4A82] text-[#B7C1DA]"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm px-3 py-1.5 rounded-full border border-[#2B4A82] text-[#B7C1DA]">
                Connexion
              </Link>
              <Link href="/signup" className="text-sm px-3 py-1.5 rounded-full bg-[#EF4135] text-[#F7F7F5]">
                Inscription
              </Link>
            </div>
          )
        )}
      </div>
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-[#3B7DD8]" />
        <div className="flex-1 bg-[#F7F7F5]" />
        <div className="flex-1 bg-[#EF4135]" />
      </div>
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = pathname === t.href;
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={
                'condensed font-semibold text-sm px-3.5 py-2 rounded-t-md whitespace-nowrap flex items-center gap-1.5 border-b-[3px] ' +
                (active
                  ? 'bg-[#F7F7F5] text-[#0A1F44] border-[#EF4135]'
                  : 'text-[#B7C1DA] border-[#2B4A82]')
              }
            >
              <Icon size={14} /> {t.label.toUpperCase()}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
