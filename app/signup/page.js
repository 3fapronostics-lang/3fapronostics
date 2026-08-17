'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-sm mx-auto text-center py-10">
        <h1 className="condensed text-2xl font-semibold mb-3">Vérifie ta boîte mail</h1>
        <p className="text-sm text-[#B7C1DA]">
          On t&apos;a envoyé un lien de confirmation à {email}. Clique dessus pour activer ton compte, puis reviens te connecter.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="condensed text-2xl font-semibold mb-4">Inscription</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs text-[#7C8AAE]">Pseudo affiché</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={24}
            placeholder="Affiché dans les classements"
            className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#7C8AAE]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#7C8AAE]">Mot de passe (6 caractères min.)</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded text-sm bg-[#153A70] border border-[#2B4A82] outline-none"
          />
        </div>
        {error && <p className="text-sm text-[#EF4135]">{error}</p>}
        <button
          disabled={loading}
          type="submit"
          className="w-full condensed font-semibold text-sm py-2.5 rounded-full bg-[#EF4135] disabled:opacity-60"
        >
          {loading ? 'Inscription...' : "S'inscrire"}
        </button>
      </form>
      <p className="text-sm mt-4 text-[#B7C1DA]">
        Déjà un compte ?{' '}
        <a href="/login" className="underline text-[#3B7DD8]">Connecte-toi</a>
      </p>
    </div>
  );
}
