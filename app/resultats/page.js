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

export default function ResultatsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'jules.fornage@gmail.com';
  const [champ, setChamp] = useState('elite');
  const [groups, setGroups] = useState([]);

  const load = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*, home:home_team_id(*), away:away_team_id(*)')
      .eq('champ', champ)
      .not('home_score', 'is', null)
      .order('kickoff_at', { ascending: false });

    const byJournee = {};
    (data || []).forEach((m) => {
      const j = m.journee || '?';
      if (!byJournee[j]) byJournee[j] = [];
      byJournee[j].push(m);
    });
    const entries = Object.entries(byJournee).sort((a, b) => {
      const an = parseInt(a[0], 10);
      const bn = parseInt(b[0], 10);
      if (isNaN(an) || isNaN(bn)) return 0;
      return bn - an;
    });
    setGroups(entries);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champ]);

  const removeMatch = async (id) => {
    await supabase.from('matches').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <ChampTabs value={champ} onChange={setChamp} />
      <h2 className="condensed text-2xl font-semibold mb-4">
        Résultats — {CHAMPS.find((c) => c.id === champ).label}
      </h2>
      {groups.length === 0 ? (
        <div className="text-center py-14 rounded-lg border border-dashed border-[#2B4A82]">
          <CalendarDays size={28} className="mx-auto mb-3 text-[#7C8AAE]" />
          <p className="condensed text-lg text-[#B7C1DA]">Aucun match joué pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([journee, list]) => (
            <div key={journee}>
              <p className="condensed text-sm tracking-[0.2em] mb-2 text-[#3B7DD8]">
                {journee === '?' ? 'JOURNÉE NON PRÉCISÉE' : 'JOURNÉE ' + journee}
              </p>
              <div className="space-y-2">
                {list.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg gap-2 bg-[#0F2C5C] border border-[#2B4A82]"
                  >
                    <span className="condensed text-sm shrink-0 text-[#B7C1DA]">{fmtDate(m.kickoff_at)}</span>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
