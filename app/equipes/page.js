'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import TeamLogo from '../../components/TeamLogo';
import { X } from 'lucide-react';

const CHAMPS = [
  { id: 'elite', label: 'Ligue Élite' },
  { id: 'd1', label: 'Division 1' },
  { id: 'd2', label: 'Division 2' },
];
const CONFERENCES = [
  { id: 'nord', label: 'Conférence Nord' },
  { id: 'sud', label: 'Conférence Sud' },
];

export default function EquipesPage() {
  const { user, loading } = useAuth();
  const isAdmin = user?.email === 'jules.fornage@gmail.com';
  const [champ, setChamp] = useState('elite');
  const [teams, setTeams] = useState([]);
  const [draft, setDraft] = useState({ conference: 'nord', name: '', logo_url: '' });
  const [notice, setNotice] = useState('');

  const load = async () => {
    const { data } = await supabase.from('teams').select('*').eq('champ', champ).order('name');
    setTeams(data || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champ]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const addTeam = async () => {
    if (!draft.name.trim()) return;
    const { error } = await supabase.from('teams').upsert(
      {
        champ,
        conference: champ === 'elite' ? draft.conference : null,
        name: draft.name.trim(),
        logo_url: draft.logo_url || null,
      },
      { onConflict: 'champ,name' }
    );
    if (error) {
      flash("Impossible d'ajouter cette équipe.");
      return;
    }
    setDraft((d) => ({ ...d, name: '', logo_url: '' }));
    load();
  };

  const removeTeam = async (id) => {
    await supabase.from('teams').delete().eq('id', id);
    load();
  };

  const onLogoFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, logo_url: reader.result }));
    reader.readAsDataURL(file);
  };

  if (loading) return null;

  if (!isAdmin) {
    return <p className="text-sm text-[#B7C1DA]">Accès réservé à l&apos;administrateur.</p>;
  }

  return (
    <div className="max-w-sm">
      <h1 className="condensed text-2xl font-semibold mb-4">Équipes</h1>
      {notice && (
        <div className="mb-4 px-3 py-2 rounded text-sm bg-[#EF4135]/20 border border-[#EF4135]">{notice}</div>
      )}
      <div className="space-y-3 mb-5">
        <div>
          <label className="text-xs text-[#7C8AAE]">Championnat</label>
          <select
            value={champ}
            onChange={(e) => setChamp(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
          >
            {CHAMPS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        {champ === 'elite' && (
          <div>
            <label className="text-xs text-[#7C8AAE]">Conférence</label>
            <select
              value={draft.conference}
              onChange={(e) => setDraft((d) => ({ ...d, conference: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
            >
              {CONFERENCES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs text-[#7C8AAE]">Nom de l&apos;équipe</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#7C8AAE]">Lien du logo (URL, optionnel)</label>
          <input
            value={draft.logo_url && draft.logo_url.startsWith('data:') ? '' : draft.logo_url}
            placeholder="https://..."
            onChange={(e) => setDraft((d) => ({ ...d, logo_url: e.target.value }))}
            className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#7C8AAE]">ou importer une image</label>
          <input type="file" accept="image/*" onChange={onLogoFile} className="w-full mt-1 text-xs" />
        </div>
        {draft.logo_url && (
          <div className="flex items-center gap-2">
            <img
              src={draft.logo_url}
              alt=""
              className="rounded-full object-cover"
              style={{ width: 32, height: 32, border: '1px solid #2B4A82' }}
            />
            <span className="text-xs text-[#7C8AAE]">Aperçu du logo</span>
          </div>
        )}
        <button
          onClick={addTeam}
          className="w-full condensed font-semibold text-sm py-2 rounded-full bg-[#3B7DD8]"
        >
          Ajouter / mettre à jour l&apos;équipe
        </button>
      </div>
      <p className="text-xs mb-2 text-[#7C8AAE]">
        {CHAMPS.find((c) => c.id === champ).label} · {teams.length} équipe{teams.length > 1 ? 's' : ''}
      </p>
      <div className="space-y-1">
        {teams.map((t) => (
          <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#153A70]">
            <TeamLogo team={t} size={20} />
            <span className="flex-1 text-sm mono truncate">{t.name}</span>
            <button onClick={() => removeTeam(t.id)} className="text-[#7C8AAE]">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
