'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message);
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="condensed text-2xl font-semibold mb-4">Connexion</h1>
      <form onSubmit={submit} className="space-y-3">
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
          <label className="text-xs text-[#7C8AAE]">Mot de passe</label>
          <input
            type="password"
            required
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
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p className="text-sm mt-3 text-[#B7C1DA]">
        <a href="/mot-de-passe-oublie" className="underline text-[#3B7DD8]">Mot de passe oublié ?</a>
      </p>
      <p className="text-sm mt-2 text-[#B7C1DA]">
        Pas encore de compte ?{' '}
        <a href="/signup" className="underline text-[#3B7DD8]">Inscris-toi</a>
      </p>
    </div>
  );
}
