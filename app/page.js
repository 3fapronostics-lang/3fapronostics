'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { CHAMPS } from '../components/ChampTabs';
import ChampionPick from '../components/ChampionPick';
import FormDots from '../components/FormDots';
import TeamLogo from '../components/TeamLogo';
import WinnerPicker from '../components/WinnerPicker';
import { Plus, Lock, X, ShieldCheck, Pencil } from 'lucide-react';

// Les matchs apparaissent pour les joueurs X jours avant le coup d'envoi
const VISIBLE_DAYS = 7;

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
  const [teamsByChamp, setTeamsByChamp] = useState({ elite: [], d1: [], d2: [] });
  const [matchesByChamp, setMatchesByChamp] = useState({ elite: [], d1: [], d2: [] });
  const [formByChamp, setFormByChamp] = useState({ elite: {}, d1: {}, d2: {} });
  const [myPredictions, setMyPredictions] = useState({});
  const [draftPredictions, setDraftPredictions] = useState({});
  const [resultDrafts, setResultDrafts] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newMatch, setNewMatch] = useState({ champ: 'elite', home_team_id: '', away_team_id: '', journee: '', date: '', time: '14:00' });
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const loadId = useRef(0);
  const [hiddenMatches, setHiddenMatches] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenChamp, setHiddenChamp] = useState('elite');
  const [hiddenJournee, setHiddenJournee] = useState('1');

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const load = async () => {
    const myId = ++loadId.current;
    const { data: allTeams } = await supabase.from('teams').select('*').order('name');
    if (myId !== loadId.current) return;
    const tByChamp = { elite: [], d1: [], d2: [] };
    (allTeams || []).forEach((t) => {
      if (tByChamp[t.champ]) tByChamp[t.champ].push(t);
    });
    setTeamsByChamp(tByChamp);

    const horizonISO = new Date(Date.now() + VISIBLE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Matchs visibles par tout le monde : coup d'envoi dans les 7 prochains jours (ou déjà passé)
    const { data: allMatches, error: errVisible } = await supabase
      .from('matches')
      .select('*, home:home_team_id(*), away:away_team_id(*)')
      .is('home_score', null)
      .lte('kickoff_at', horizonISO)
      .order('kickoff_at', { ascending: true });
    if (myId !== loadId.current) return;
    if (errVisible) flash('Erreur de chargement des matchs : ' + errVisible.message);
    const mByChamp = { elite: [], d1: [], d2: [] };
    (allMatches || []).forEach((m) => {
      if (mByChamp[m.champ]) mByChamp[m.champ].push(m);
    });
    setMatchesByChamp(mByChamp);

    // Calendrier à venir : uniquement pour l'admin
    if (isAdmin) {
      const { data: futureMatches, error: errHidden } = await supabase
        .from('matches')
        .select('*, home:home_team_id(*), away:away_team_id(*)')
        .is('home_score', null)
        .gt('kickoff_at', horizonISO)
        .order('kickoff_at', { ascending: true })
        .limit(2000);
      if (myId !== loadId.current) return;
      if (errHidden) flash('Erreur de chargement du calendrier à venir : ' + errHidden.message);
      setHiddenMatches(futureMatches || []);
    } else {
      setHiddenMatches([]);
    }

    const { data: playedMatches } = await supabase
      .from('matches')
      .select('champ, home_team_id, away_team_id, home_score, away_score, kickoff_at')
      .not('home_score', 'is', null)
      .order('kickoff_at', { ascending: true });
    if (myId !== loadId.current) return;
    const fByChamp = { elite: {}, d1: {}, d2: {} };
    (playedMatches || []).forEach((m) => {
      if (!fByChamp[m.champ]) return;
      const outcome = (isHome) => {
        if (m.home_score === m.away_score) return 'D';
        const homeWon = m.home_score > m.away_score;
        return isHome === homeWon ? 'W' : 'L';
      };
      if (!fByChamp[m.champ][m.home_team_id]) fByChamp[m.champ][m.home_team_id] = [];
      if (!fByChamp[m.champ][m.away_team_id]) fByChamp[m.champ][m.away_team_id] = [];
      fByChamp[m.champ][m.home_team_id].push(outcome(true));
      fByChamp[m.champ][m.away_team_id].push(outcome(false));
    });
    Object.keys(fByChamp).forEach((c) => {
      Object.keys(fByChamp[c]).forEach((teamId) => {
        fByChamp[c][teamId] = fByChamp[c][teamId].slice(-5);
      });
    });
    setFormByChamp(fByChamp);

    if (user && allMatches && allMatches.length) {
      const ids = allMatches.map((m) => m.id);
      const { data: preds } = await supabase
        .from('predictions')
        .select('match_id, choice')
        .eq('user_id', user.id)
        .in('match_id', ids);
      if (myId !== loadId.current) return;
      const map = {};
      (preds || []).forEach((p) => {
        map[p.match_id] = p.choice;
      });
      setMyPredictions(map);
      setDraftPredictions(map);
    } else {
      setMyPredictions({});
      setDraftPredictions({});
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const choosePrediction = (matchId, choice) => {
    if (!user) return;
    setDraftPredictions((prev) => ({ ...prev, [matchId]: choice }));
  };

  const validatePrediction = async (matchId) => {
    const choice = draftPredictions[matchId];
    if (!user || !choice) return;
    const { error } = await supabase
      .from('predictions')
      .upsert({ match_id: matchId, user_id: user.id, choice }, { onConflict: 'match_id,user_id' });
    if (error) {
      flash("Impossible d'enregistrer ce pronostic.");
      return;
    }
    setMyPredictions((prev) => ({ ...prev, [matchId]: choice }));
    flash('Pronostic enregistré ✓');
  };

  const isLocked = (m) => new Date() >= new Date(m.kickoff_at);

  const emptyMatch = (champ) => ({ champ, home_team_id: '', away_team_id: '', journee: '', date: '', time: '14:00' });

  const openAdd = () => {
    setEditingId(null);
    setNewMatch(emptyMatch(newMatch.champ));
    setShowAdd(true);
  };

  const openEdit = (m) => {
    const d = new Date(m.kickoff_at);
    const pad = (n) => String(n).padStart(2, '0');
    setEditingId(m.id);
    setNewMatch({
      champ: m.champ,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      journee: m.journee ? String(m.journee) : '',
      date: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()),
      time: pad(d.getHours()) + ':' + pad(d.getMinutes()),
    });
    setShowAdd(true);
  };

  const closeModal = () => {
    setShowAdd(false);
    setEditingId(null);
  };

  const saveMatch = async () => {
    if (!newMatch.home_team_id || !newMatch.away_team_id || !newMatch.date) return;
    if (newMatch.home_team_id === newMatch.away_team_id) {
      flash('Les deux équipes doivent être différentes.');
      return;
    }
    const payload = {
      champ: newMatch.champ,
      home_team_id: newMatch.home_team_id,
      away_team_id: newMatch.away_team_id,
      journee: newMatch.journee ? parseInt(newMatch.journee, 10) : null,
      kickoff_at: new Date(`${newMatch.date}T${newMatch.time}`).toISOString(),
    };
    const { error } = editingId
      ? await supabase.from('matches').update(payload).eq('id', editingId)
      : await supabase.from('matches').insert(payload);
    if (error) {
      flash(editingId ? 'Impossible de modifier ce match.' : "Impossible d'ajouter ce match.");
      return;
    }
    setNewMatch(emptyMatch(newMatch.champ));
    setEditingId(null);
    setShowAdd(false);
    flash(editingId ? 'Match modifié ✓' : 'Match ajouté ✓');
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
          SAISON 2026/2027 · FOOTBALL AMÉRICAIN EN FRANCE ÉLITE/D1/D2
        </p>
        <h1 className="display leading-[0.9] text-4xl sm:text-5xl">
          À VOS PRONOS !
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

      {isAdmin && (
        <button
          onClick={openAdd}
          className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full bg-[#153A70] text-[#EF4135] border border-[#B72E23] mb-6"
        >
          <Plus size={15} /> Ajouter un match
        </button>
      )}

      {CHAMPS.map((c) => {
        const matches = matchesByChamp[c.id] || [];
        const teams = teamsByChamp[c.id] || [];
        return (
          <div key={c.id} className="mb-10">
            <h2 className="condensed text-2xl font-semibold mb-3">{c.label}</h2>

            <ChampionPick champ={c.id} teams={teams} user={user} isAdmin={isAdmin} label={c.label} />

            {matches.length === 0 ? (
              <div className="text-center py-10 rounded-lg border border-dashed border-[#2B4A82]">
                <ShieldCheck size={24} className="mx-auto mb-2 text-[#7C8AAE]" />
                <p className="condensed text-base text-[#B7C1DA]">Aucun match à pronostiquer pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((m) => {
                  const locked = isLocked(m);
                  const mine = draftPredictions[m.id] || null;
                  const savedMine = myPredictions[m.id] || null;
                  const dirty = mine && mine !== savedMine;
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
                            <button onClick={() => openEdit(m)} className="text-[#7C8AAE]" title="Modifier">
                              <Pencil size={13} />
                            </button>
                          )}
                          {isAdmin && (
                            <button onClick={() => removeMatch(m.id)} className="text-[#7C8AAE]" title="Supprimer">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <TeamLogo team={m.home} />
                            <span className="condensed text-lg">{m.home?.name}</span>
                          </div>
                          <FormDots results={(formByChamp[c.id] || {})[m.home_team_id]} />
                        </div>
                        <span className="mono text-xs text-[#7C8AAE]">VS</span>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="condensed text-lg">{m.away?.name}</span>
                            <TeamLogo team={m.away} />
                          </div>
                          <FormDots results={(formByChamp[c.id] || {})[m.away_team_id]} />
                        </div>
                      </div>

                      <WinnerPicker
                        home={m.home}
                        away={m.away}
                        value={mine}
                        disabled={!user || locked}
                        onChange={(choice) => choosePrediction(m.id, choice)}
                      />

                      {user && !locked && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => validatePrediction(m.id)}
                            disabled={!dirty}
                            className="condensed text-xs font-semibold px-3 py-1.5 rounded-full bg-[#EF4135] text-[#F7F7F5] disabled:opacity-40"
                          >
                            Valider mon pronostic
                          </button>
                          {!dirty && savedMine && (
                            <span className="text-xs text-[#3B7DD8]">✓ Pronostic enregistré</span>
                          )}
                        </div>
                      )}

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
          </div>
        );
      })}

      {isAdmin && (
        <div className="mb-10">
          <button
            onClick={() => setShowHidden((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#153A70] border border-[#B72E23] text-left"
          >
            <span className="condensed text-base font-semibold text-[#EF4135]">
              Calendrier à venir (masqué aux joueurs) · {hiddenMatches.length} matchs
            </span>
            <span className="text-[#EF4135]">{showHidden ? '▲' : '▼'}</span>
          </button>

          {showHidden && (() => {
            const list = hiddenMatches.filter(
              (m) => m.champ === hiddenChamp && (hiddenJournee === '' || String(m.journee) === hiddenJournee)
            );
            return (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2 mb-3">
                  {CHAMPS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setHiddenChamp(c.id)}
                      className={
                        'condensed text-sm font-medium px-3 py-1.5 rounded-full border ' +
                        (hiddenChamp === c.id
                          ? 'bg-[#3B7DD8] text-[#0A1F44] border-[#3B7DD8]'
                          : 'text-[#B7C1DA] border-[#2B4A82]')
                      }
                    >
                      {c.label}
                    </button>
                  ))}
                  <select
                    value={hiddenJournee}
                    onChange={(e) => setHiddenJournee(e.target.value)}
                    className="px-3 py-1.5 rounded-full text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                  >
                    <option value="">Toutes les journées</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((j) => (
                      <option key={j} value={String(j)}>J{j}</option>
                    ))}
                  </select>
                </div>

                {list.length === 0 ? (
                  <p className="text-sm text-[#7C8AAE]">Aucun match masqué pour ce filtre.</p>
                ) : (
                  <div className="space-y-1">
                    {list.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded bg-[#0F2C5C] border border-[#2B4A82]">
                        <div className="flex-1 min-w-0">
                          <p className="mono text-[11px] text-[#7C8AAE]">
                            {m.journee ? 'J' + m.journee + ' · ' : ''}
                            {fmtDate(m.kickoff_at)}
                          </p>
                          <p className="condensed text-sm flex items-center gap-1.5 flex-wrap">
                            <TeamLogo team={m.home} size={20} />
                            <span>{m.home?.name}</span>
                            <span className="text-[#7C8AAE]">vs</span>
                            <TeamLogo team={m.away} size={20} />
                            <span>{m.away?.name}</span>
                          </p>
                        </div>
                        <button onClick={() => openEdit(m)} className="text-[#7C8AAE]" title="Modifier">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => removeMatch(m.id)} className="text-[#7C8AAE]" title="Supprimer">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70">
          <div className="w-full sm:max-w-sm rounded-t-xl sm:rounded-xl p-5 bg-[#0F2C5C] border border-[#2B4A82]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="condensed text-xl font-semibold">{editingId ? 'Modifier le match' : 'Nouveau match'}</h3>
              <button onClick={closeModal} className="text-[#7C8AAE]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7C8AAE]">Championnat</label>
                <select
                  value={newMatch.champ}
                  disabled={!!editingId}
                  onChange={(e) => setNewMatch((n) => ({ ...n, champ: e.target.value, home_team_id: '', away_team_id: '' }))}
                  className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                >
                  {CHAMPS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#7C8AAE]">Équipe à domicile</label>
                <select
                  value={newMatch.home_team_id}
                  onChange={(e) => setNewMatch((n) => ({ ...n, home_team_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                >
                  <option value="">—</option>
                  {(teamsByChamp[newMatch.champ] || []).map((t) => (
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
                  {(teamsByChamp[newMatch.champ] || []).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {(teamsByChamp[newMatch.champ] || []).length === 0 && (
                <p className="text-xs text-[#7C8AAE]">
                  Aucune équipe dans cette division —{' '}
                  <a href="/equipes" className="underline text-[#3B7DD8]">ajoutes-en d&apos;abord</a>.
                </p>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-[#7C8AAE]">Journée</label>
                  <select
                    value={newMatch.journee}
                    onChange={(e) => setNewMatch((n) => ({ ...n, journee: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                  >
                    <option value="">—</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((j) => (
                      <option key={j} value={j}>J{j}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="text-xs text-[#7C8AAE]">Date</label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={(e) => setNewMatch((n) => ({ ...n, date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#7C8AAE]">Heure</label>
                <input
                  type="time"
                  step="900"
                  value={newMatch.time}
                  onChange={(e) => setNewMatch((n) => ({ ...n, time: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
                />
              </div>
              <button
                onClick={saveMatch}
                className="w-full mt-2 condensed font-semibold text-sm py-2.5 rounded-full bg-[#EF4135]"
              >
                {editingId ? 'Enregistrer les modifications' : 'Ajouter le match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
