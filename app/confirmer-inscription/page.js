'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const tokenHash = params.get('token_hash');
  const router = useRouter();

  const [step, setStep] = useState('confirm'); // confirm | form | done
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const unlockForm = async () => {
    if (!tokenHash) {
      setError('Lien invalide ou incomplet.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    setLoading(false);
    if (error) {
      setError("Ce lien a expiré ou n'est plus valide. Redemande un nouveau lien.");
      return;
    }
    setStep('form');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('6 caractères minimum.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep('done');
    setTimeout(() => router.push('/login'), 2000);
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="condensed text-2xl font-semibold mb-4">Nouveau mot de passe</h1>

      {step === 'confirm' && (
        <div className="text-center">
          <p className="text-sm mb-5 text-[#B7C1DA]">
            Clique sur le bouton pour continuer la réinitialisation de ton mot de passe.
          </p>
          <button
            onClick={unlockForm}
            disabled={loading}
            className="w-full condensed font-semibold text-sm py-2.5 rounded-full bg-[#EF4135] disabled:opacity-60"
          >
            {loading ? 'Vérification...' : 'Continuer'}
          </button>
          {error && (
            <p className="text-sm mt-3 text-[#EF4135]">
              {error}{' '}
              <a href="/mot-de-passe-oublie" className="underline text-[#3B7DD8]">Redemander un lien</a>
            </p>
          )}
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-[#7C8AAE]">Nouveau mot de passe (6 caractères min.)</label>
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
            {loading ? 'Enregistrement...' : 'Valider le nouveau mot de passe'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <p className="text-sm text-[#B7C1DA]">
          Mot de passe mis à jour ! Redirection vers la connexion...
        </p>
      )}
    </div>
  );
}
