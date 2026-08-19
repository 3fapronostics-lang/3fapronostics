'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reinitialiser-mot-de-passe` : undefined,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="condensed text-2xl font-semibold mb-4">Mot de passe oublié</h1>
      {sent ? (
        <p className="text-sm text-[#B7C1DA]">
          Si un compte existe avec cet email, un lien de réinitialisation vient de t&apos;être envoyé. Pense à vérifier tes spams.
        </p>
      ) : (
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
          {error && <p className="text-sm text-[#EF4135]">{error}</p>}
          <button
            disabled={loading}
            type="submit"
            className="w-full condensed font-semibold text-sm py-2.5 rounded-full bg-[#EF4135] disabled:opacity-60"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>
      )}
      <p className="text-sm mt-4 text-[#B7C1DA]">
        <a href="/login" className="underline text-[#3B7DD8]">Retour à la connexion</a>
      </p>
    </div>
  );
}
