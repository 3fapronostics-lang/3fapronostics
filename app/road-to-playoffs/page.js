'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import ChampTabs, { CHAMPS } from '../../components/ChampTabs';
import TeamLogo from '../../components/TeamLogo';
import { Medal } from 'lucide-react';

const ADMIN_EMAIL = 'jules.fornage@gmail.com';

// ---------------------------------------------------------------------------
// RÈGLES DE QUALIFICATION PAR DIVISION
// groups : les classements utilisés (conférence, poule, nombre de qualifiés)
// rounds : les rencontres de phase finale ; { g: groupe, r: rang }
// Pour ajouter l'Élite ou la D2, il suffit de compléter cet objet.
// ---------------------------------------------------------------------------
const RULES = {
  elite: {
    groups: [
      { id: 'nord', label: 'Conférence Nord', conference: 'nord', poule: null, qualified: 2 },
      { id: 'sud', label: 'Conférence Sud', conference: 'sud', poule: null, qualified: 2 },
    ],
    rounds: [
      {
        title: 'Demi-finales · 12/13 juin 2027',
        matches: [
          { slot: 'sf1', label: 'Demi-finale 1', a: { g: 'nord', r: 1 }, b: { g: 'sud', r: 2 } },
          { slot: 'sf2', label: 'Demi-finale 2', a: { g: 'sud', r: 1 }, b: { g: 'nord', r: 2 } },
        ],
      },
      {
        title: 'Finale Élite · Casque de diamant · 26 juin 2027',
        matches: [
          { slot: 'final', label: 'Finale Élite · Casque de diamant', a: { w: 'sf1', ph: 'Vainqueur demi-finale 1' }, b: { w: 'sf2', ph: 'Vainqueur demi-finale 2' }, champion: 'Casque de diamant' },
        ],
      },
    ],
    note: "* Les affiches se précisent au fil du classement et sont confirmées à la fin de la saison régulière.",
  },
  d1: {
    groups: [
      { id: 'no', label: 'Poule Nord-Ouest', conference: 'nord', poule: 'Nord-Ouest', qualified: 2 },
      { id: 'ne', label: 'Poule Nord-Est', conference: 'nord', poule: 'Nord-Est', qualified: 2 },
      { id: 'sud', label: 'Conférence Sud', conference: 'sud', poule: null, qualified: 4 },
    ],
    rounds: [
      {
        title: 'Demi-finales · 29/30 mai 2027',
        matches: [
          { slot: 'nord-sf1', label: 'Conférence Nord · Demi-finale 1', a: { g: 'no', r: 1 }, b: { g: 'ne', r: 2 } },
          { slot: 'nord-sf2', label: 'Conférence Nord · Demi-finale 2', a: { g: 'ne', r: 1 }, b: { g: 'no', r: 2 } },
          { slot: 'sud-sf1', label: 'Conférence Sud · Demi-finale 1', a: { g: 'sud', r: 1 }, b: { g: 'sud', r: 4 } },
          { slot: 'sud-sf2', label: 'Conférence Sud · Demi-finale 2', a: { g: 'sud', r: 2 }, b: { g: 'sud', r: 3 } },
        ],
      },
      {
        title: 'Finales de conférence · 5/6 juin 2027',
        matches: [
          { slot: 'nord-cf', label: 'Finale de conférence Nord', a: { w: 'nord-sf1', ph: 'Vainqueur demi-finale 1 Nord' }, b: { w: 'nord-sf2', ph: 'Vainqueur demi-finale 2 Nord' } },
          { slot: 'sud-cf', label: 'Finale de conférence Sud', a: { w: 'sud-sf1', ph: 'Vainqueur demi-finale 1 Sud' }, b: { w: 'sud-sf2', ph: 'Vainqueur demi-finale 2 Sud' } },
        ],
      },
      {
        title: "Finale D1 · Casque d'or · 19/20 juin 2027",
        matches: [
          { slot: 'final', label: "Finale D1 · Casque d'or", a: { w: 'nord-cf', ph: 'Vainqueur conférence Nord' }, b: { w: 'sud-cf', ph: 'Vainqueur conférence Sud' }, champion: "Casque d'or" },
        ],
      },
    ],
    note: "* L'équipe qui reçoit est déterminée selon l'art. 56 du règlement particulier relatif aux compétitions de football américain. Les affiches se précisent au fil du classement et sont confirmées à la fin de la saison régulière.",
  },
  d2: {
    groups: [
      // Conférence Nord
      { id: 'idfo', label: 'IDF Ouest', conference: 'nord', members: ['flash b', 'lycans', 'molosses b', 'cobras'], qualified: 1 },
      { id: 'nor', label: 'NOR', conference: 'nord', members: ['boucaniers', 'conquerants', 'salamandres', 'terribles', 'leopards b'], qualified: 1 },
      { id: 'idfs', label: 'IDF Sud', conference: 'nord', members: ['mousquetaires', 'citizens', 'dragons', 'chevaliers'], qualified: 1 },
      { id: 'idfe', label: 'IDF Est', conference: 'nord', members: ['fontenay', 'homies', 'saints', 'pygargues'], qualified: 1 },
      { id: 'hdf', label: 'HDF', conference: 'nord', members: ['bears', 'coyotes', 'spartiates b', 'mustangs', 'wildcats'], qualified: 1 },
      { id: 'gre', label: 'GRE', conference: 'nord', members: ['minotaure', 'patriotes', 'geants', 'artilleurs', 'tigres'], qualified: 1 },
      { id: 'bre', label: 'BRE', conference: 'nord', members: ['kelted', 'licornes', 'tonnerre', 'celtics', 'mariners', 'the bridge'], qualified: 1 },
      { id: 'pdl', label: 'PDL', conference: 'nord', members: ['yankees', 'ankou', 'dockers', 'pionn', 'caimans'], qualified: 1 },
      // Conférence Sud
      { id: 'ara', label: 'ARA', conference: 'sud', members: ['falcons', 'centaures', 'gones', 'aigles', 'sharks', 'avalanches', 'black panthers'], qualified: 1 },
      { id: 'bfc', label: 'BFC', conference: 'sud', members: ['hawks', 'marshals', 'fenris', 'bisons', 'chalon'], qualified: 1 },
      { id: 'atl', label: 'Atlantique', conference: 'sud', members: ['kangourous', 'sphinx', 'bordeaux', 'ours b', 'scorpions', 'grizzlys'], qualified: 1 },
      { id: 'med', label: 'Méditerranée', conference: 'sud', members: ['black lions', 'centurions de n', 'empereurs', 'argonautes', 'avignon', 'blue stars'], qualified: 1 },
    ],
    rounds: [
      {
        title: 'Barrages · 22/23 mai 2027 (Conférence Nord)',
        matches: [
          { slot: 'nord-b1', label: 'Barrage 1', a: { g: 'idfo', r: 1 }, b: { g: 'nor', r: 1 } },
          { slot: 'nord-b2', label: 'Barrage 2', a: { g: 'idfs', r: 1 }, b: { g: 'idfe', r: 1 } },
          { slot: 'nord-b3', label: 'Barrage 3', a: { g: 'hdf', r: 1 }, b: { g: 'gre', r: 1 } },
          { slot: 'nord-b4', label: 'Barrage 4', a: { g: 'bre', r: 1 }, b: { g: 'pdl', r: 1 } },
        ],
      },
      {
        title: 'Demi-finales · 5/6 juin 2027',
        matches: [
          { slot: 'nord-sf1', label: 'Conférence Nord · Demi-finale 1', a: { w: 'nord-b1', ph: 'Vainqueur barrage 1' }, b: { w: 'nord-b2', ph: 'Vainqueur barrage 2' } },
          { slot: 'nord-sf2', label: 'Conférence Nord · Demi-finale 2', a: { w: 'nord-b3', ph: 'Vainqueur barrage 3' }, b: { w: 'nord-b4', ph: 'Vainqueur barrage 4' } },
          { slot: 'sud-sf1', label: 'Conférence Sud · Demi-finale 1', a: { g: 'ara', r: 1 }, b: { g: 'bfc', r: 1 } },
          { slot: 'sud-sf2', label: 'Conférence Sud · Demi-finale 2', a: { g: 'atl', r: 1 }, b: { g: 'med', r: 1 } },
        ],
      },
      {
        title: 'Finales de conférence · 12/13 juin 2027',
        matches: [
          { slot: 'nord-cf', label: 'Finale de conférence Nord', a: { w: 'nord-sf1', ph: 'Vainqueur demi-finale 1 Nord' }, b: { w: 'nord-sf2', ph: 'Vainqueur demi-finale 2 Nord' } },
          { slot: 'sud-cf', label: 'Finale de conférence Sud', a: { w: 'sud-sf1', ph: 'Vainqueur demi-finale 1 Sud' }, b: { w: 'sud-sf2', ph: 'Vainqueur demi-finale 2 Sud' } },
        ],
      },
      {
        title: "Finale D2 · Casque d'argent · 26/27 juin 2027",
        matches: [
          { slot: 'final', label: "Finale D2 · Casque d'argent", a: { w: 'nord-cf', ph: 'Vainqueur conférence Nord' }, b: { w: 'sud-cf', ph: 'Vainqueur conférence Sud' }, champion: "Casque d'argent" },
        ],
      },
    ],
    note: "* La rencontre se joue chez le club avec le meilleur bilan de la saison régulière (conférence Nord) ; l'équipe qui reçoit est déterminée selon l'art. 56 du règlement particulier relatif aux compétitions de football américain (conférence Sud). Les affiches se précisent au fil du classement.",
  },
};

const norm = (s) => (s || '').toLowerCase().replace(/[\s\-_]/g, '');
const plain = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const rankLabel = (r) => (r === 1 ? '1er' : r + 'ème');

export default function RoadToPlayoffsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [champ, setChamp] = useState('d1');
  const [rows, setRows] = useState([]);
  const [results, setResults] = useState({});
  const [notice, setNotice] = useState('');

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const load = async (isCancelled = () => false) => {
    const { data: teams } = await supabase.from('teams').select('*').eq('champ', champ);
    const { data: matches } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score')
      .eq('champ', champ)
      .not('home_score', 'is', null);
    const { data: res } = await supabase.from('playoff_results').select('slot, winner_team_id').eq('champ', champ);
    if (isCancelled()) return;

    const table = {};
    (teams || []).forEach((t) => {
      table[String(t.id)] = { team: t, played: 0, pts: 0, w: 0, t: 0, l: 0, pf: 0, pa: 0 };
    });
    (matches || []).forEach((m) => {
      const h = table[String(m.home_team_id)];
      const a = table[String(m.away_team_id)];
      if (!h || !a) return;
      h.pf += m.home_score; h.pa += m.away_score;
      a.pf += m.away_score; a.pa += m.home_score;
      h.played += 1; a.played += 1;
      if (m.home_score > m.away_score) { h.w += 1; a.l += 1; h.pts += 3; a.pts += 1; }
      else if (m.home_score < m.away_score) { a.w += 1; h.l += 1; a.pts += 3; h.pts += 1; }
      else { h.t += 1; a.t += 1; h.pts += 2; a.pts += 2; }
    });

    const list = Object.values(table).map((r) => {
      const pts = Math.max(0, r.pts - (r.team.pen || 0));
      return { ...r, pts, coef: r.played > 0 ? pts / r.played : 0 };
    });
    list.sort(
      (x, y) =>
        y.coef - x.coef ||
        (y.pf - y.pa) - (x.pf - x.pa) ||
        (x.team.name || '').localeCompare(y.team.name || '')
    );
    setRows(list);

    const map = {};
    (res || []).forEach((r) => {
      map[r.slot] = r.winner_team_id ? String(r.winner_team_id) : '';
    });
    setResults(map);
  };

  useEffect(() => {
    let cancelled = false;
    setRows([]);
    setResults({});
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champ]);

  const rules = RULES[champ];
  const allMatches = rules ? rules.rounds.flatMap((r) => r.matches) : [];
  const label = CHAMPS.find((c) => c.id === champ)?.label;

  const rankGroup = (g) =>
    rows.filter((r) => {
      if (g.members) {
        const n = plain(r.team.name);
        return g.members.some((k) => n.includes(k));
      }
      return r.team.conference === g.conference && (!g.poule || norm(r.team.poule) === norm(g.poule));
    });

  const groupStarted = (g) => rankGroup(g).some((r) => r.played > 0);

  const teamById = (id) => (id ? rows.find((r) => String(r.team.id) === String(id))?.team || null : null);

  // Renvoie l'équipe d'une case : issue du classement (g/r) ou vainqueur d'un match précédent (w)
  const resolveSlot = (ref) => {
    if (ref.w) {
      const prev = allMatches.find((m) => m.slot === ref.w);
      const pa = resolveSlot(prev.a);
      const pb = resolveSlot(prev.b);
      const wid = results[ref.w] || '';
      const team = [pa.team, pb.team].find((t) => t && String(t.id) === wid) || null;
      return { team, placeholder: ref.ph };
    }
    const g = rules.groups.find((x) => x.id === ref.g);
    const list = rankGroup(g);
    const team = groupStarted(g) ? list[ref.r - 1]?.team || null : null;
    return { team, placeholder: rankLabel(ref.r) + ' · ' + g.label };
  };

  const setWinner = async (slot, teamId) => {
    const { error } = await supabase
      .from('playoff_results')
      .upsert({ champ, slot, winner_team_id: teamId || null }, { onConflict: 'champ,slot' });
    if (error) {
      flash("Impossible d'enregistrer (la table playoff_results existe-t-elle ?).");
      return;
    }
    setResults((prev) => ({ ...prev, [slot]: teamId || '' }));
  };

  const TeamLine = ({ team, placeholder, winner, loser }) => (
    <div
      className={
        'flex items-center gap-2 px-3 py-2 rounded ' +
        (winner ? 'bg-[#3B7DD8]/25 border border-[#3B7DD8]' : 'bg-[#153A70] border border-transparent') +
        (loser ? ' opacity-50' : '')
      }
    >
      {team ? (
        <>
          <TeamLogo team={team} size={30} />
          <span className="condensed text-sm font-semibold truncate">{team.name}</span>
          {winner && <span className="ml-auto text-xs text-[#3B7DD8]">✓ qualifié</span>}
        </>
      ) : (
        <span className="condensed text-sm text-[#7C8AAE]">{placeholder}</span>
      )}
    </div>
  );

  return (
    <div>
      <ChampTabs value={champ} onChange={setChamp} />
      <h2 className="condensed text-2xl font-semibold mb-1 flex items-center gap-2">
        <Medal size={22} className="text-[#EF4135]" /> Road to playoffs — {label}
      </h2>
      <p className="text-xs text-[#7C8AAE] mb-5">
        Mis à jour automatiquement avec le classement (COEF).
      </p>

      {notice && (
        <div className="mb-4 px-3 py-2 rounded text-sm bg-[#EF4135]/20 border border-[#EF4135]">{notice}</div>
      )}

      {!rules ? (
        <div className="text-center py-14 rounded-lg border border-dashed border-[#2B4A82]">
          <Medal size={28} className="mx-auto mb-3 text-[#7C8AAE]" />
          <p className="condensed text-lg text-[#B7C1DA]">Les règles de qualification arrivent bientôt.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-6">
            {rules.groups.map((g, gi) => {
              const list = rankGroup(g);
              return (
                <div key={g.id}>
                  {(gi === 0 || rules.groups[gi - 1].conference !== g.conference) && (
                    <p className="display text-xl mb-3 mt-2">CONFÉRENCE {g.conference.toUpperCase()}</p>
                  )}
                  <p className="condensed text-sm tracking-[0.15em] mb-2 text-[#3B7DD8]">
                    {g.label.toUpperCase()} · {g.qualified} {g.qualified > 1 ? 'QUALIFIÉS' : 'QUALIFIÉ'}
                  </p>
                  <div className="rounded-lg overflow-hidden border border-[#2B4A82]">
                    <div className="grid grid-cols-[2rem,1fr,3rem,2rem,2.5rem] gap-1 px-3 py-2 text-[11px] mono text-[#7C8AAE] border-b border-[#2B4A82]">
                      <span>#</span><span>Équipe</span>
                      <span className="text-center">COEF</span>
                      <span className="text-center">J</span>
                      <span className="text-center">PTS</span>
                    </div>
                    {list.map((r, i) => {
                      const qualified = i < g.qualified;
                      const cut = i === g.qualified - 1 && i < list.length - 1;
                      return (
                        <div
                          key={String(r.team.id)}
                          className={
                            'grid grid-cols-[2rem,1fr,3rem,2rem,2.5rem] gap-1 items-center px-3 py-2 border-l-4 ' +
                            (qualified ? 'border-[#3B7DD8] bg-[#0F2C5C]' : 'border-transparent bg-[#0A1F44]') +
                            (cut ? ' border-b-2 border-b-dashed border-b-[#EF4135]' : '')
                          }
                          style={cut ? { borderBottom: '2px dashed #EF4135' } : undefined}
                        >
                          <span className="mono text-xs text-[#7C8AAE]">{i + 1}</span>
                          <span className="condensed flex items-center gap-2 text-sm min-w-0">
                            <TeamLogo team={r.team} size={28} />
                            <span className={'truncate ' + (qualified ? '' : 'text-[#7C8AAE]')}>{r.team.name}</span>
                          </span>
                          <span className="display text-sm text-center text-[#EF4135]">{r.coef.toFixed(2)}</span>
                          <span className="mono text-xs text-center text-[#B7C1DA]">{r.played}</span>
                          <span className="display text-sm text-center">{r.pts}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="rounded-t-lg px-4 py-2 bg-black text-center">
              <p className="display text-xl tracking-wide">PHASES FINALES</p>
            </div>
            <div className="space-y-6 pt-4 border border-t-0 border-[#2B4A82] rounded-b-lg px-3 pb-4">
              {rules.rounds.map((round) => (
                <div key={round.title}>
                  <p className="condensed text-sm tracking-[0.1em] mb-3 text-[#B7C1DA]">{round.title.toUpperCase()}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {round.matches.map((m) => {
                      const a = resolveSlot(m.a);
                      const b = resolveSlot(m.b);
                      const winnerId = results[m.slot] || '';
                      const aWon = a.team && winnerId === String(a.team.id);
                      const bWon = b.team && winnerId === String(b.team.id);
                      return (
                        <div key={m.slot} className="rounded-lg p-3 bg-[#0F2C5C] border border-dashed border-[#2B4A82]">
                          <p className="mono text-[11px] text-[#7C8AAE] mb-2">{m.label}</p>
                          <div className="space-y-1">
                            <TeamLine team={a.team} placeholder={a.placeholder} winner={aWon} loser={bWon} />
                            <p className="text-center mono text-[11px] text-[#7C8AAE]">VS</p>
                            <TeamLine team={b.team} placeholder={b.placeholder} winner={bWon} loser={aWon} />
                          </div>
                          {isAdmin && a.team && b.team && (
                            <div className="mt-3 pt-2 border-t border-[#2B4A82]">
                              <label className="text-xs text-[#7C8AAE]">Vainqueur (admin)</label>
                              <select
                                value={winnerId}
                                onChange={(e) => setWinner(m.slot, e.target.value)}
                                className="w-full mt-1 px-3 py-1.5 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                              >
                                <option value="">—</option>
                                <option value={String(a.team.id)}>{a.team.name}</option>
                                <option value={String(b.team.id)}>{b.team.name}</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {round.matches.some((m) => m.champion) && (() => {
                    const fm = round.matches.find((m) => m.champion);
                    const champTeam = (() => {
                      const a = resolveSlot(fm.a).team;
                      const b = resolveSlot(fm.b).team;
                      const wid = results[fm.slot] || '';
                      return [a, b].find((t) => t && String(t.id) === wid) || null;
                    })();
                    return champTeam ? (
                      <div className="mt-4 rounded-lg p-4 text-center bg-[#EF4135]/15 border border-[#EF4135]">
                        <p className="condensed text-xs tracking-[0.2em] text-[#EF4135] mb-2">CHAMPION {label.toUpperCase()} · {String(fm.champion).toUpperCase()}</p>
                        <div className="flex items-center justify-center gap-3">
                          <TeamLogo team={champTeam} size={48} />
                          <span className="display text-2xl">{champTeam.name}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
              <p className="text-xs text-[#7C8AAE]">{rules.note}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
