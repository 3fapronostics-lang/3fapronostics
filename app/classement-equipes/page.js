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

function dash(v) {
  return v && v > 0 ? v : '–';
}

function StandingsTable({ rows, teamsById }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#2B4A82]">
      <div className="min-w-[820px]">
        <div className="grid grid-cols-[2.4fr,repeat(11,0.62fr)] gap-1 px-3 py-2 text-[11px] mono text-[#7C8AAE] border-b border-[#2B4A82]">
          <span>Équipe</span>
          <span className="text-center">COEF</span>
          <span className="text-center">J</span>
          <span className="text-center">PTS</span>
          <span className="text-center">PEN</span>
          <span className="text-center">F</span>
          <span className="text-center">G</span>
          <span className="text-center">N</span>
          <span className="text-center">P</span>
          <span className="text-center">+</span>
          <span className="text-center">-</span>
          <span className="text-center">DIF</span>
        </div>
        {rows.map((row, i) => {
          const t = teamsById[row.teamId];
          const dif = row.pf - row.pa;
          return (
            <div
              key={row.teamId}
              className={
                'grid grid-cols-[2.4fr,repeat(11,0.62fr)] gap-1 items-center px-3 py-2.5 ' +
                (i % 2 === 0 ? 'bg-[#0F2C5C]' : 'bg-[#153A70]')
              }
            >
              <span className="condensed flex items-center gap-2 text-sm min-w-0">
                <TeamLogo team={t} size={60} />
                <span className="truncate">{t?.name}</span>
              </span>
              <span className="display text-sm text-center text-[#EF4135]">{row.coef.toFixed(2)}</span>
              <span className="mono text-xs text-center text-[#B7C1DA]">{row.played}</span>
              <span className="display text-sm text-center">{row.pts}</span>
              <span className="mono text-xs text-center text-[#7C8AAE]">{dash(t?.pen)}</span>
              <span className="mono text-xs text-center text-[#7C8AAE]">{dash(t?.forfeit)}</span>
              <span className="mono text-xs text-center text-[#B7C1DA]">{row.w}</span>
              <span className="mono text-xs text-center text-[#B7C1DA]">{row.t}</span>
              <span className="mono text-xs text-center text-[#B7C1DA]">{row.l}</span>
              <span className="mono text-xs text-center text-[#B7C1DA]">{row.pf}</span>
              <span className="mono text-xs text-center text-[#B7C1DA]">{row.pa}</span>
              <span className={'mono text-xs text-center ' + (dif >= 0 ? 'text-[#3B7DD8]' : 'text-[#EF4135]')}>
                {dif >= 0 ? '+' : ''}
                {dif}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ClassementEquipesPage() {
  const [champ, setChamp] = useState('elite');
  const [standings, setStandings] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: teamsData } = await supabase.from('teams').select('*').eq('champ', champ);
      const tMap = {};
      (teamsData || []).forEach((t) => {
        tMap[t.id] = t;
      });
      setTeamsById(tMap);
      setTeams(teamsData || []);

      const { data: matches } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .eq('champ', champ)
        .not('home_score', 'is', null);

      const table = {};
      const ensure = (id) => {
        if (!table[id]) table[id] = { teamId: id, w: 0, l: 0, t: 0, pf: 0, pa: 0, played: 0, pts: 0 };
        return table[id];
      };

      (matches || []).forEach((m) => {
        const h = ensure(m.home_team_id);
        const a = ensure(m.away_team_id);
        h.pf += m.home_score;
        h.pa += m.away_score;
        a.pf += m.away_score;
        a.pa += m.home_score;
        h.played += 1;
        a.played += 1;
        if (m.home_score > m.away_score) {
          h.w += 1; a.l += 1; h.pts += 3; a.pts += 1;
        } else if (m.home_score < m.away_score) {
          a.w += 1; h.l += 1; a.pts += 3; h.pts += 1;
        } else {
          h.t += 1; a.t += 1; h.pts += 2; a.pts += 2;
        }
      });

      (teamsData || []).forEach((t) => ensure(t.id));

      const rows = Object.values(table).map((row) => {
        const pts = Math.max(0, row.pts - (tMap[row.teamId]?.pen || 0));
        const coef = row.played > 0 ? pts / row.played : 0;
        return { ...row, pts, coef };
      });

      rows.sort((x, y) => y.coef - x.coef || (y.pf - y.pa) - (x.pf - x.pa));
      setStandings(rows);
    })();
  }, [champ]);

  const withConf = (confId) => standings.filter((row) => teamsById[row.teamId]?.conference === confId);
  const withoutConf = standings.filter((row) => !teamsById[row.teamId]?.conference);

  const poulesInConf = (confId) => {
    const set = new Set();
    teams.forEach((t) => {
      if (t.conference === confId && t.poule) set.add(t.poule);
    });
    return Array.from(set);
  };

  const withPoule = (confId, poule) =>
    standings.filter((row) => teamsById[row.teamId]?.conference === confId && teamsById[row.teamId]?.poule === poule);

  const hasPoules = teams.some((t) => t.poule);

  return (
    <div>
      <ChampTabs value={champ} onChange={setChamp} />
      <h2 className="condensed text-2xl font-semibold mb-4">
        Classement équipes — {CHAMPS.find((c) => c.id === champ).label}
      </h2>
      {standings.length === 0 ? (
        <div className="text-center py-14 rounded-lg border border-dashed border-[#2B4A82]">
          <Shield size={28} className="mx-auto mb-3 text-[#7C8AAE]" />
          <p className="condensed text-lg text-[#B7C1DA]">Aucune équipe dans cette division.</p>
        </div>
      ) : hasPoules ? (
        <div className="space-y-8">
          {CONFERENCES.map((conf) => {
            const poules = poulesInConf(conf.id);
            if (poules.length === 0 && withConf(conf.id).length === 0) return null;
            return (
              <div key={conf.id}>
                <p className="condensed text-base tracking-[0.15em] mb-3 text-[#EF4135]">{conf.label.toUpperCase()}</p>
                <div className="space-y-5 pl-1">
                  {poules.map((poule) => (
                    <div key={poule}>
                      <p className="condensed text-sm tracking-[0.15em] mb-2 text-[#3B7DD8]">POULE {poule.toUpperCase()}</p>
                      <StandingsTable rows={withPoule(conf.id, poule)} teamsById={teamsById} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
