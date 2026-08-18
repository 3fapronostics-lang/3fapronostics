'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import ChampTabs, { CHAMPS } from '../../components/ChampTabs';
import TeamLogo from '../../components/TeamLogo';
import { CalendarDays, X } from 'lucide-react';

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) +
      ' · ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return iso;
  }
}

const JOURNEES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function ResultatsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'jules.fornage@gmail.com';
  const [champ, setChamp] = useState('elite');
  const [journee, setJournee] = useState('toutes');
  const [matches, setMatches] = useState([]);

  const load = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*, home:home_team_id(*), away:away_team_id(*)')
      .eq('champ', champ)
      .not('home_score', 'is', null)
      .order('kickoff_at', { ascending: false });
    setMatches(data || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champ]);

  const removeMatch = async (id) => {
    await supabase.from('matches').delete().eq('id', id);
    load();
  };

  const journeesJouees = Array.from(new Set(matches.map((m) => m.journee).filter(Boolean))).sort((a, b) => a - b);
  const shown = journee === 'toutes' ? matches : matches.filter((m) => m.journee === Number(journee));

  return (
    <div>
      <ChampTabs value={champ} onChange={setChamp} />
      <h2 className="condensed text-2xl font-semibold mb-4">
        Résultats — {CHAMPS.find((c) => c.id === champ).label}
      </h2>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        <button
          onClick={() => setJournee('toutes')}
          className={
            'condensed text-sm font-medium px-3 py-1.5 rounded-full border whitespace-nowrap ' +
            (journee === 'toutes'
              ? 'bg-[#3B7DD8] text-[#0A1F44] border-[#3B7DD8]'
              : 'text-[#B7C1DA] border-[#2B4A82]')
          }
        >
          Toutes
        </button>
        {JOURNEES.map((j) => (
          <button
            key={j}
            onClick={() => setJournee(String(j))}
            disabled={!journeesJouees.includes(j)}
            className={
              'condensed text-sm font-medium px-3 py-1.5 rounded-full border whitespace-nowrap disabled:opacity-30 ' +
              (journee === String(j)
                ? 'bg-[#3B7DD8] text-[#0A1F44] border-[#3B7DD8]'
                : 'text-[#B7C1DA] border-[#2B4A82]')
            }
          >
            J{j}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-14 rounded-lg border border-dashed border-[#2B4A82]">
          <CalendarDays size={28} className="mx-auto mb-3 text-[#7C8AAE]" />
          <p className="condensed text-lg text-[#B7C1DA]">Aucun match joué pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg gap-2 bg-[#0F2C5C] border border-[#2B4A82]"
            >
              <span className="condensed text-sm shrink-0 text-[#B7C1DA]">
                {m.journee ? 'J' + m.journee + ' · ' : ''}
                {fmtDate(m.kickoff_at)}
              </span>
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <TeamLogo team={m.home} size={26} />
                <span className="condensed truncate">{m.home?.name}</span>
                <span className="display text-lg shrink-0 text-[#EF4135]">
                  {m.home_score} – {m.away_score}
                </span>
                <span className="condensed truncate">{m.away?.name}</span>
                <TeamLogo team={m.away} size={26} />
              </div>
              {isAdmin && (
                <button onClick={() => removeMatch(m.id)} className="text-[#7C8AAE] shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
