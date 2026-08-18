'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ChampTabs, { CHAMPS } from '../../components/ChampTabs';
import { Medal, Users } from 'lucide-react';

export default function ClassementDivisionsPage() {
  const [champ, setChamp] = useState('elite');
  const [board, setBoard] = useState([]);

  useEffect(() => {
    (async () => {
      const stats = {};

      const { data: matches } = await supabase
        .from('matches')
        .select('id, home_score, away_score')
        .eq('champ', champ)
        .not('home_score', 'is', null);

      if (matches && matches.length > 0) {
        const ids = matches.map((m) => m.id);
        const { data: preds } = await supabase
          .from('predictions')
          .select('match_id, choice, user_id, profiles(display_name)')
          .in('match_id', ids);

        const byMatch = {};
        matches.forEach((m) => {
          byMatch[m.id] = m;
        });

        (preds || []).forEach((p) => {
          const m = byMatch[p.match_id];
          if (!m) return;
          const winner = m.home_score === m.away_score ? 'draw' : m.home_score > m.away_score ? 'home' : 'away';
          const pt = p.choice === winner ? 3 : 0;
          const key = p.user_id;
          if (!stats[key]) stats[key] = { user: p.profiles?.display_name || 'Joueur', pts: 0, played: 0 };
          stats[key].pts += pt;
          stats[key].played += 1;
        });
      }

      const { data: champConfig } = await supabase
        .from('champion_config')
        .select('winner_team_id')
        .eq('champ', champ)
        .maybeSingle();

      if (champConfig?.winner_team_id) {
        const { data: champPreds } = await supabase
          .from('champion_predictions')
          .select('team_id, user_id, profiles(display_name)')
          .eq('champ', champ);

        (champPreds || []).forEach((p) => {
          if (p.team_id !== champConfig.winner_team_id) return;
          const key = p.user_id;
          if (!stats[key]) stats[key] = { user: p.profiles?.display_name || 'Joueur', pts: 0, played: 0 };
          stats[key].pts += 30;
        });
      }

      setBoard(Object.values(stats).sort((a, b) => b.pts - a.pts || b.played - a.played));
    })();
  }, [champ]);

  return (
    <div>
      <ChampTabs value={champ} onChange={setChamp} />
      <h2 className="condensed text-2xl font-semibold mb-4">
        Classement pronostiqueurs — {CHAMPS.find((c) => c.id === champ).label}
      </h2>
      {board.length === 0 ? (
        <div className="text-center py-14 rounded-lg border border-dashed border-[#2B4A82]">
          <Users size={28} className="mx-auto mb-3 text-[#7C8AAE]" />
          <p className="condensed text-lg text-[#B7C1DA]">Pas encore de points dans cette division.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-[#2B4A82]">
          {board.map((row, i) => (
            <div
              key={row.user + i}
              className={'flex items-center gap-3 px-4 py-3 ' + (i % 2 === 0 ? 'bg-[#0F2C5C]' : 'bg-[#153A70]')}
            >
              <span className="display text-lg w-7 text-center">
                {i === 0 ? <Medal size={18} className="text-[#EF4135] inline" /> : i + 1}
              </span>
              <span className="mono flex-1 truncate">{row.user}</span>
              <span className="text-xs text-[#7C8AAE]">{row.played} pronos</span>
              <span className="display text-xl text-[#EF4135]">{row.pts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
