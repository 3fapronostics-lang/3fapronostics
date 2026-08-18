'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import TeamLogo from './TeamLogo';
import { Trophy, Lock } from 'lucide-react';

export default function ChampionPick({ champ, teams, user, isAdmin, label }) {
  const [config, setConfig] = useState(null);
  const [myPick, setMyPick] = useState(null);
  const [draftDeadline, setDraftDeadline] = useState('');
  const [draftWinner, setDraftWinner] = useState('');
  const [notice, setNotice] = useState('');

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const load = async () => {
    const { data: cfg } = await supabase
      .from('champion_config')
      .select('*')
      .eq('champ', champ)
      .maybeSingle();
    setConfig(cfg || null);
    setDraftDeadline(cfg?.deadline ? cfg.deadline.slice(0, 16) : '');
    setDraftWinner(cfg?.winner_team_id || '');

    if (user) {
      const { data: mine } = await supabase
        .from('champion_predictions')
        .select('team_id')
        .eq('champ', champ)
        .eq('user_id', user.id)
        .maybeSingle();
      setMyPick(mine?.team_id || null);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champ, user]);

  const locked = config?.deadline ? new Date() >= new Date(config.deadline) : false;

  const pick = async (teamId) => {
    if (!user || locked) return;
    await supabase
      .from('champion_predictions')
      .upsert({ champ, user_id: user.id, team_id: teamId }, { onConflict: 'champ,user_id' });
    setMyPick(teamId);
  };

  const saveDeadline = async () => {
    if (!draftDeadline) return;
    await supabase
      .from('champion_config')
      .upsert({ champ, deadline: new Date(draftDeadline).toISOString() }, { onConflict: 'champ' });
    flash('Date de clôture enregistrée.');
    load();
  };

  const saveWinner = async () => {
    if (!draftWinner) return;
    await supabase
      .from('champion_config')
      .upsert({ champ, winner_team_id: draftWinner }, { onConflict: 'champ' });
    flash('Champion enregistré.');
    load();
  };

  return (
    <div className="mb-6 rounded-lg px-5 py-4 bg-[#0F2C5C] border border-[#2B4A82]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="condensed text-lg font-semibold flex items-center gap-2">
          <Trophy size={16} className="text-[#EF4135]" /> Champion {label}
        </h3>
        {config?.deadline && (
          <span className="flex items-center gap-1 text-xs mono text-[#7C8AAE]">
            {locked && <Lock size={11} />}
            Clôture {new Date(config.deadline).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {notice && (
        <div className="mb-3 px-3 py-2 rounded text-sm bg-[#EF4135]/20 border border-[#EF4135]">{notice}</div>
      )}

      {config?.winner_team_id && (
        <p className="text-sm mb-3 text-[#B7C1DA]">
          🏆 Champion : {teams.find((t) => t.id === config.winner_team_id)?.name}
        </p>
      )}

      {!user && <p className="text-sm text-[#B7C1DA]">Connecte-toi pour pronostiquer le champion.</p>}

      {user && !config?.deadline && !isAdmin && (
        <p className="text-sm text-[#7C8AAE]">Le pronostic champion n&apos;est pas encore ouvert.</p>
      )}

      {user && config?.deadline && (
        <div className="flex flex-wrap gap-2">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              disabled={locked}
              className={
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ' +
                (myPick === t.id
                  ? 'bg-[#EF4135] border-[#EF4135] text-[#F7F7F5]'
                  : 'bg-[#153A70] border-[#2B4A82] text-[#B7C1DA]') +
                (locked ? ' opacity-60' : '')
              }
            >
              <TeamLogo team={t} size={16} /> {t.name}
            </button>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="mt-4 pt-4 border-t border-[#2B4A82] space-y-3">
          <div>
            <label className="text-xs text-[#7C8AAE]">Date de clôture des pronostics</label>
            <div className="flex gap-2 mt-1">
              <input
                type="datetime-local"
                value={draftDeadline}
                onChange={(e) => setDraftDeadline(e.target.value)}
                className="flex-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
              />
              <button onClick={saveDeadline} className="px-3 py-2 rounded text-xs condensed font-semibold bg-[#3B7DD8]">
                Enregistrer
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#7C8AAE]">Champion réel (une fois connu)</label>
            <div className="flex gap-2 mt-1">
              <select
                value={draftWinner}
                onChange={(e) => setDraftWinner(e.target.value)}
                className="flex-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
              >
                <option value="">—</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button onClick={saveWinner} className="px-3 py-2 rounded text-xs condensed font-semibold bg-[#153A70] text-[#EF4135] border border-[#B72E23]">
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
