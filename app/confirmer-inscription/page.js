'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function ConfirmSignupInner() {
  const params = useSearchParams();
  const tokenHash = params.get('token_hash');
  const type = params.get('type') || 'signup';
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');

  const confirm = async () => {
    if (!tokenHash) {
      setError('Lien invalide ou incomplet.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      setError(error.message);
      setStatus('error');
      return;
    }
    setStatus('done');
  };

  return (
    <div className="max-w-sm mx-auto text-center">
      <h1 className="condensed text-2xl font-semibold mb-4">Confirmation d&apos;inscription</h1>

      {status === 'idle' && (
        <>
          <p className="text-sm mb-5 text-[#B7C1DA]">
            Clique sur le bouton ci-dessous pour activer ton compte 3FAPronostics.
          </p>
          <button
            onClick={confirm}
            className="w-full condensed font-semibold text-sm py-2.5 rounded-full bg-[#EF4135]"
          >
            Confirmer mon inscription
          </button>
        </>
      )}

      {status === 'loading' && <p className="text-sm text-[#B7C1DA]">Confirmation en cours...</p>}

      {status === 'done' && (
        <p className="text-sm text-[#B7C1DA]">
          Ton compte est activé ! Tu peux maintenant{' '}
          <a href="/login" className="underline text-[#3B7DD8]">te connecter</a>.
        </p>
      )}

      {status === 'error' && (
        <>
          <p className="text-sm mb-3 text-[#EF4135]">
            {error || "Ce lien a expiré ou n'est plus valide."}
          </p>
          <a href="/signup" className="text-sm underline text-[#3B7DD8]">Retenter une inscription</a>
        </>
      )}
    </div>
  );
}

export default function ConfirmSignupPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmSignupInner />
    </Suspense>
  );
}
