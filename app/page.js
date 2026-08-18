'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import ChampTabs, { CHAMPS } from '../components/ChampTabs';
import ChampionPick from '../components/ChampionPick';
import TeamLogo from '../components/TeamLogo';
import WinnerPicker from '../components/WinnerPicker';
import { Plus, Lock, X, ShieldCheck } from 'lucide-react';

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

export default function PronosticsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'jules.fornage@gmail.com';
  const [champ, setChamp] = useState('elite');
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myPredictions, setMyPredictions] = useState({});
  const [resultDrafts, setResultDrafts] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newMatch, setNewMatch] = useState({ home_team_id: '', away_team_id: '', journee: '', kickoff_at: '' });
  const [notice, setNotice] = useState('');

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const load = async () => {
    const { data: teamsData } = await supabase.from('teams').select('*').eq('champ', champ).order('name');
    setTeams(teamsData || []);

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*, home:home_team_id(*), away:away_team_id(*)')
      .eq('champ', champ)
      .is('home_score', null)
      .order('kickoff_at', { ascending: true });
    setMatches(matchesData || []);

    if (user && matchesData && matchesData.length) {
      const ids = matchesData.map((m) => m.id);
      const { data: preds } = await supabase
        .from('predictions')
        .select('match_id, choice')
        .eq('user_id', user.id)
        .in('match_id', ids);
      const map = {};
      (preds || []).forEach((p) => {
        map[p.match_id] = p.choice;
      });
      setMyPredictions(map);
    } else {
      setMyPredictions({});
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champ, user]);

  const choosePrediction = async (matchId, choice) => {
    if (!user) return;
    setMyPredictions((prev) => ({ ...prev, [matchId]: choice }));
    const { error } = await supabase
      .from('predictions')
      .upsert({ match_id: matchId, user_id: user.id, choice }, { onConflict: 'match_id,user_id' });
    if (error) flash("Impossible d'enregistrer ce pronostic.");
  };

  const isLocked = (m) => new Date() >= new Date(m.kickoff_at);

  const addMatch = async () => {
    if (!newMatch.home_team_id || !newMatch.away_team_id || !newMatch.kickoff_at) return;
    if (newMatch.home_team_id === newMatch.away_team_id) {
      flash('Les deux équipes doivent être différentes.');
      return;
    }
    const { error } = await supabase.from('matches').insert({
      champ,
      home_team_id: newMatch.home_team_id,
      away_team_id: newMatch.away_team_id,
      journee: newMatch.journee ? parseInt(newMatch.journee, 10) : null,
      kickoff_at: newMatch.kickoff_at,
    });
    if (error) {
      flash("Impossible d'ajouter ce match.");
      return;
    }
    setNewMatch({ home_team_id: '', away_team_id: '', journee: '', kickoff_at: '' });
    setShowAdd(false);
    load();
  };

  const removeMatch = async (id) => {
    await supabase.from('matches').delete().eq('id', id);
    load();
  };

  const setResultDraft = (matchId, field, value) => {
    setResultDrafts((prev) => ({ ...prev, [matchId]: { ...(prev[matchId] || {}), [field]: value } }));
  };

  const confirmResult = async (matchId) => {
    const d = resultDrafts[matchId];
    if (!d || d.home === '' || d.home == null || d.away === '' || d.away == null) return;
    const { error } = await supabase
      .from('matches')
      .update({ home_score: parseInt(d.home, 10) || 0, away_score: parseInt(d.away, 10) || 0 })
      .eq('id', matchId);
    if (error) {
      flash("Impossible d'enregistrer le résultat.");
      return;
    }
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <p className="condensed text-sm tracking-[0.3em] mb-2 text-[#EF4135]">
          SAISON 2026 · FOOTBALL AMÉRICAIN FRANÇAIS
        </p>
        <h1 className="display leading-[0.9] text-4xl sm:text-5xl">
          PRONOSTIQUE. DÉFIE. <span className="text-[#EF4135]">DOMINE.</span>
        </h1>
      </div>

      {!user && (
        <div className="mb-5 px-3 py-2.5 rounded text-sm bg-[#3B7DD8]/20 border border-[#3B7DD8]">
          <a href="/login" className="underline">Connecte-toi</a> pour pouvoir pronostiquer.
        </div>
      )}
      {notice && (
        <div className="mb-4 px-3 py-2 rounded text-sm bg-[#EF4135]/20 border border-[#EF4135]">{notice}</div>
      )}

      <ChampTabs value={champ} onChange={setChamp} />
        <ChampionPick
        champ={champ}
        teams={teams}
        user={user}
        isAdmin={isAdmin}
        label={CHAMPS.find((c) => c.id === champ)?.label}
      />

      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="condensed text-2xl font-semibold">
          {CHAMPS.find((c) => c.id === champ).label} — à pronostiquer
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full bg-[#153A70] text-[#EF4135] border border-[#B72E23]"
          >
            <Plus size={15} /> Match
          </button>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-14 rounded-lg border border-dashed border-[#2B4A82]">
          <ShieldCheck size={28} className="mx-auto mb-3 text-[#7C8AAE]" />
          <p className="condensed text-lg text-[#B7C1DA]">Aucun match à pronostiquer ici.</p>
          <p className="text-sm mt-1 text-[#7C8AAE]">
            Ajoute le prochain match de {CHAMPS.find((c) => c.id === champ).label}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const locked = isLocked(m);
            const mine = myPredictions[m.id] || null;
            return (
              <div key={m.id} className="relative rounded-lg px-5 py-4 bg-[#0F2C5C] border border-dashed border-[#2B4A82]">
                <div className="flex items-center justify-between mb-3">
                  <span className="mono text-xs text-[#7C8AAE]">
                    {m.journee ? 'J' + m.journee + ' · ' : ''}
                    {fmtDate(m.kickoff_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    {locked && (
                      <span className="flex items-center gap-1 text-xs mono text-[#B7C1DA]">
                        <Lock size={11} /> verrouillé
                      </span>
                    )}
                    {isAdmin && (
                      <button onClick={() => removeMatch(m.id)} className="text-[#7C8AAE]">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <TeamLogo team={m.home} />
                    <span className="condensed text-lg">{m.home?.name}</span>
                  </div>
                  <span className="mono text-xs text-[#7C8AAE]">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="condensed text-lg">{m.away?.name}</span>
                    <TeamLogo team={m.away} />
                  </div>
                </div>

                <WinnerPicker
                  home={m.home}
                  away={m.away}
                  value={mine}
                  disabled={!user || locked}
                  onChange={(choice) => choosePrediction(m.id, choice)}
                />

                {locked && isAdmin && (
                  <div className="mt-3 pt-3 border-t border-[#2B4A82]">
                    <p className="text-xs mb-1.5 text-[#7C8AAE]">Entrer le résultat final :</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="–"
                        value={(resultDrafts[m.id] || {}).home ?? ''}
                        onChange={(e) => setResultDraft(m.id, 'home', e.target.value)}
                        className="display text-xl w-14 text-center rounded-md bg-[#153A70] border-2 border-[#2B4A82] py-1 outline-none"
                      />
                      <span className="display text-lg text-[#7C8AAE]">–</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="–"
                        value={(resultDrafts[m.id] || {}).away ?? ''}
                        onChange={(e) => setResultDraft(m.id, 'away', e.target.value)}
                        className="display text-xl w-14 text-center rounded-md bg-[#153A70] border-2 border-[#2B4A82] py-1 outline-none"
                      />
                      <button
                        onClick={() => confirmResult(m.id)}
                        className="ml-auto text-xs condensed font-semibold px-3 py-1.5 rounded-full bg-[#153A70] text-[#EF4135] border border-[#B72E23]"
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70">
          <div className="w-full sm:max-w-sm rounded-t-xl sm:rounded-xl p-5 bg-[#0F2C5C] border border-[#2B4A82]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="condensed text-xl font-semibold">Nouveau match</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#7C8AAE]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7C8AAE]">Équipe à domicile</label>
                <select
                  value={newMatch.home_team_id}
                  onChange={(e) => setNewMatch((n) => ({ ...n, home_team_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                >
                  <option value="">—</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#7C8AAE]">Équipe visiteuse</label>
                <select
                  value={newMatch.away_team_id}
                  onChange={(e) => setNewMatch((n) => ({ ...n, away_team_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                >
                  <option value="">—</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {teams.length === 0 && (
                <p className="text-xs text-[#7C8AAE]">
                  Aucune équipe dans cette division —{' '}
                  <a href="/equipes" className="underline text-[#3B7DD8]">ajoutes-en d&apos;abord</a>.
                </p>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-[#7C8AAE]">Journée</label>
                  <input
                    type="number"
                    min="1"
                    value={newMatch.journee}
                    onChange={(e) => setNewMatch((n) => ({ ...n, journee: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-xs text-[#7C8AAE]">Date et heure</label>
                  <input
                    type="datetime-local"
                    value={newMatch.kickoff_at}
                    onChange={(e) => setNewMatch((n) => ({ ...n, kickoff_at: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                  />
                </div>
              </div>
              <button
                onClick={addMatch}
                className="w-full mt-2 condensed font-semibold text-sm py-2.5 rounded-full bg-[#EF4135]"
              >
                Ajouter le match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
