'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ChampTabs, { CHAMPS } from '../../components/ChampTabs';
import TeamLogo from '../../components/TeamLogo';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function CalendrierPage() {
  const [champ, setChamp] = useState('elite');
  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState([]);
  const [journee, setJournee] = useState(null);
  const [pouleFilter, setPouleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const loadId = useRef(0);

  useEffect(() => {
    const id = ++loadId.current;
    setLoading(true);
    setPouleFilter('all');
    (async () => {
      const { data: t } = await supabase.from('teams').select('*').eq('champ', champ);
      const { data: m } = await supabase
        .from('matches')
        .select('id, journee, kickoff_at, home_team_id, away_team_id, home_score, away_score')
        .eq('champ', champ)
        .order('kickoff_at', { ascending: true })
        .limit(2000);
      if (id !== loadId.current) return;
      const map = {};
      (t || []).forEach((x) => (map[String(x.id)] = x));
      setTeams(map);
      const list = m || [];
      setMatches(list);
      // Journée par défaut : la première qui a encore un match à jouer, sinon la dernière
      const js = [...new Set(list.map((x) => x.journee).filter((j) => j != null))].sort((a, b) => a - b);
      const next = js.find((j) => list.some((x) => x.journee === j && x.home_score == null));
      setJournee(next ?? js[js.length - 1] ?? null);
      setLoading(false);
    })();
  }, [champ]);

  const pouleOf = (id) => {
    const t = teams[String(id)];
    return t ? t.poule || t.conference || '' : '';
  };
  const pouleOptions = [...new Set(Object.values(teams).map((t) => t.poule || t.conference || '').filter(Boolean))].sort((x, y) =>
    x.localeCompare(y, 'fr')
  );
  const inFilter = (m) => {
    if (pouleFilter === 'all') return true;
    const h = pouleOf(m.home_team_id);
    const a = pouleOf(m.away_team_id);
    if (pouleFilter === '__inter') return h !== a;
    return h === pouleFilter || a === pouleFilter;
  };
  const filtered = matches.filter(inFilter);
  const journees = [...new Set(filtered.map((x) => x.journee).filter((j) => j != null))].sort((x, y) => x - y);
  const effJournee = journees.includes(journee) ? journee : journees[0] ?? null;
  const idx = journees.indexOf(effJournee);
  const shown = filtered.filter((m) => m.journee === effJournee);

  // Regroupement par poule : même poule → section de la poule, sinon "Interpoules"
  const INTER = 'Interpoules';
  const groups = {};
  shown.forEach((m) => {
    const h = pouleOf(m.home_team_id);
    const a = pouleOf(m.away_team_id);
    const key = h && h === a ? h : INTER;
    (groups[key] = groups[key] || []).push(m);
  });
  Object.values(groups).forEach((arr) => arr.sort((x, y) => new Date(x.kickoff_at) - new Date(y.kickoff_at)));
  const firstTime = (k) => new Date(groups[k][0].kickoff_at).getTime();
  const groupKeys = Object.keys(groups).sort(
    (x, y) =>
      firstTime(x) - firstTime(y) ||
      (x === INTER ? 1 : y === INTER ? -1 : x.localeCompare(y, 'fr'))
  );
  const showHeaders = groupKeys.length > 1 || groupKeys[0] !== INTER;
  const label = CHAMPS.find((c) => c.id === champ)?.label;

  const Team = ({ id, right }) => {
    const t = teams[String(id)];
    return (
      <div className={`flex items-center gap-2 min-w-0 flex-1 ${right ? 'justify-end text-right' : ''}`}>
        {!right && t && <TeamLogo team={t} size={30} />}
        <span className="condensed text-base font-semibold truncate">{t?.name || '—'}</span>
        {right && t && <TeamLogo team={t} size={30} />}
      </div>
    );
  };

  return (
    <div>
      <ChampTabs value={champ} onChange={setChamp} />
      <h2 className="condensed text-2xl font-semibold mb-1 flex items-center gap-2">
        <CalendarRange size={22} className="text-[#EF4135]" /> Calendrier — {label}
      </h2>
      <p className="text-xs text-[#7C8AAE] mb-5">
        Toute la saison, journée par journée. Les pronostics s&apos;ouvrent 7 jours avant chaque match.
      </p>

      {!loading && pouleOptions.length > 1 && (
        <div className="mb-3">
          <select
            value={pouleFilter}
            onChange={(e) => setPouleFilter(e.target.value)}
            className="condensed text-base bg-[#0F2C5C] border border-[#2B4A82] rounded px-3 py-2 w-full"
          >
            <option value="all">Toutes les poules</option>
            <option value="__inter">Matchs interpoules uniquement</option>
            {pouleOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-[#B7C1DA]">Chargement…</p>
      ) : journees.length === 0 ? (
        <p className="text-[#B7C1DA]">Aucun match pour ce filtre.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-4">
            <button
              onClick={() => setJournee(journees[idx - 1])}
              disabled={idx <= 0}
              className="p-2 rounded bg-[#0F2C5C] border border-[#2B4A82] disabled:opacity-30"
              aria-label="Journée précédente"
            >
              <ChevronLeft size={18} />
            </button>
            <select
              value={effJournee ?? ''}
              onChange={(e) => setJournee(parseInt(e.target.value, 10))}
              className="condensed text-lg font-semibold bg-[#0F2C5C] border border-[#2B4A82] rounded px-3 py-2 flex-1 text-center"
            >
              {journees.map((j) => (
                <option key={j} value={j}>
                  Journée {j}
                </option>
              ))}
            </select>
            <button
              onClick={() => setJournee(journees[idx + 1])}
              disabled={idx >= journees.length - 1}
              className="p-2 rounded bg-[#0F2C5C] border border-[#2B4A82] disabled:opacity-30"
              aria-label="Journée suivante"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {groupKeys.map((k) => (
              <div key={k}>
                {showHeaders && (
                  <p className="condensed text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="inline-block w-1 h-5 bg-[#EF4135] rounded" />
                    {k.toUpperCase()}
                    <span className="mono text-xs text-[#7C8AAE] font-normal">
                      {groups[k].length} match{groups[k].length > 1 ? 's' : ''}
                    </span>
                  </p>
                )}
                <div className="space-y-3">
                  {groups[k].map((m) => {
                    const played = m.home_score != null && m.away_score != null;
                    return (
                      <div key={m.id} className="rounded-lg border border-[#2B4A82] bg-[#0F2C5C] p-3">
                        <p className="mono text-xs text-[#7C8AAE] mb-2">{fmtDate(m.kickoff_at)}</p>
                        <div className="flex items-center gap-3">
                          <Team id={m.home_team_id} />
                          <span className="mono text-lg font-bold shrink-0 min-w-[64px] text-center">
                            {played ? `${m.home_score} - ${m.away_score}` : 'vs'}
                          </span>
                          <Team id={m.away_team_id} right />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
