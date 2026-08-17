'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ChampTabs, { CHAMPS } from '../../components/ChampTabs';
import TeamLogo from '../../components/TeamLogo';
import { Shield } from 'lucide-react';

const CONFERENCES = [
  { id: 'nord', label: 'Conférence Nord' },
  { id: 'sud', label: 'Conférence Sud' },
];

function StandingsTable({ rows, teamsById }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[#2B4A82]">
      <div className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] gap-2 px-4 py-2 text-xs mono text-[#7C8AAE] border-b border-[#2B4A82]">
        <span>Équipe</span><span>V</span><span>N</span><span>D</span><span>+/-</span><span>Pts</span>
      </div>
      {rows.map((row, i) => {
        const t = teamsById[row.teamId];
        return (
          <div
            key={row.teamId}
            className={'grid grid-cols-[1fr,auto,auto,auto,auto,auto] items-center gap-2 px-4 py-3 ' + (i % 2 === 0 ? 'bg-[#0F2C5C]' : 'bg-[#153A70]')}
          >
            <span className="condensed flex items-center gap-2 truncate">
              <TeamLogo team={t} size={18} />
              {t?.name}
            </span>
            <span className="mono text-sm text-center text-[#B7C1DA]">{row.w}</span>
            <span className="mono text-sm text-center text-[#B7C1DA]">{row.t}</span>
            <span className="mono text-sm text-center text-[#B7C1DA]">{row.l}</span>
            <span className={'mono text-sm text-center ' + (row.pf - row.pa >= 0 ? 'text-[#3B7DD8]' : 'text-[#EF4135]')}>
              {row.pf - row.pa >= 0 ? '+' : ''}
              {row.pf - row.pa}
            </span>
            <span className="display text-lg text-center text-[#EF4135]">{row.pts}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ClassementEquipesPage() {
  const [champ, setChamp] = useState('elite');
  const [standings, setStandings] = useState([]);
  const [teamsById, setTeamsById] = useState({});

  useEffect(() => {
    (async () => {
      const { data: teams } = await supabase.from('teams').select('*').eq('champ', champ);
      const tMap = {};
      (teams || []).forEach((t) => {
        tMap[t.id] = t;
      });
      setTeamsById(tMap);

      const { data: matches } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .eq('champ', champ)
        .not('home_score', 'is', null);

      const table = {};
      const ensure = (id) => {
        if (!table[id]) table[id] = { teamId: id, w: 0, l: 0, t: 0, pf: 0, pa: 0, pts: 0 };
        return table[id];
      };
      (matches || []).forEach((m) => {
        const h = ensure(m.home_team_id);
        const a = ensure(m.away_team_id);
        h.pf += m.home_score;
        h.pa += m.away_score;
        a.pf += m.away_score;
        a.pa += m.home_score;
        if (m.home_score > m.away_score) {
          h.w += 1; a.l += 1; h.pts += 2;
        } else if (m.home_score < m.away_score) {
          a.w += 1; h.l += 1; a.pts += 2;
        } else {
          h.t += 1; a.t += 1; h.pts += 1; a.pts += 1;
        }
      });
      setStandings(Object.values(table).sort((x, y) => y.pts - x.pts || y.pf - y.pa - (x.pf - x.pa)));
    })();
  }, [champ]);

  const withConf = (confId) => standings.filter((row) => teamsById[row.teamId]?.conference === confId);
  const withoutConf = standings.filter((row) => !teamsById[row.teamId]?.conference);

  return (
    <div>
      <ChampTabs value={champ} onChange={setChamp} />
      <h2 className="condensed text-2xl font-semibold mb-4">
        Classement équipes — {CHAMPS.find((c) => c.id === champ).label}
      </h2>
      {standings.length === 0 ? (
        <div className="text-center py-14 rounded-lg border border-dashed border-[#2B4A82]">
          <Shield size={28} className="mx-auto mb-3 text-[#7C8AAE]" />
          <p className="condensed text-lg text-[#B7C1DA]">Aucun résultat pour établir un classement.</p>
        </div>
      ) : champ === 'elite' ? (
        <div className="space-y-6">
          {CONFERENCES.map(
            (conf) =>
              withConf(conf.id).length > 0 && (
                <div key={conf.id}>
                  <p className="condensed text-sm tracking-[0.2em] mb-2 text-[#3B7DD8]">{conf.label.toUpperCase()}</p>
                  <StandingsTable rows={withConf(conf.id)} teamsById={teamsById} />
                </div>
              )
          )}
          {withoutConf.length > 0 && (
            <div>
              <p className="condensed text-sm tracking-[0.2em] mb-2 text-[#7C8AAE]">SANS CONFÉRENCE</p>
              <StandingsTable rows={withoutConf} teamsById={teamsById} />
            </div>
          )}
        </div>
      ) : (
        <StandingsTable rows={standings} teamsById={teamsById} />
      )}
    </div>
  );
}
