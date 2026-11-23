'use client';

import { BookOpen, Flame, Lock, Trophy, CalendarDays, Crown } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => (
  <section className="rounded-lg border border-[#2B4A82] bg-[#0F2C5C] p-5">
    <h3 className="condensed text-xl font-semibold mb-3 flex items-center gap-2">
      <Icon size={20} className="text-[#EF4135]" /> {title}
    </h3>
    <div className="space-y-2 text-[#B7C1DA] text-sm leading-relaxed">{children}</div>
  </section>
);

export default function ReglesPage() {
  return (
    <div>
      <h2 className="condensed text-2xl font-semibold mb-1 flex items-center gap-2">
        <BookOpen size={22} className="text-[#EF4135]" /> Règlement des pronostics
      </h2>
      <p className="text-xs text-[#7C8AAE] mb-5">
        Pronostique les matchs du football américain français : Ligue Élite, D1 et D2.
      </p>

      <div className="space-y-4">
        <Section icon={Flame} title="Comment jouer">
          <p>1. Crée ton compte et confirme ton adresse e-mail.</p>
          <p>2. Dans l&apos;onglet Pronostics, choisis le vainqueur de chaque match.</p>
          <p>3. Valide ton choix : un pronostic n&apos;est enregistré qu&apos;après confirmation.</p>
          <p>Tu peux modifier ton pronostic tant que le match n&apos;a pas commencé.</p>
        </Section>

        <Section icon={CalendarDays} title="Quand pronostiquer ?">
          <p>
            Les matchs s&apos;ouvrent aux pronostics <strong className="text-white">7 jours avant le coup d&apos;envoi</strong>.
            Le calendrier complet de la saison est consultable à tout moment dans l&apos;onglet Calendrier.
          </p>
        </Section>

        <Section icon={Lock} title="Verrouillage">
          <p>
            Au coup d&apos;envoi, le pronostic est <strong className="text-white">verrouillé</strong> : plus aucune modification n&apos;est possible.
          </p>
        </Section>

        <Section icon={Trophy} title="Barème">
          <p>
            <strong className="text-white">3 points</strong> par match dont tu as trouvé le bon résultat.
          </p>
          <p>Un mauvais pronostic ne fait pas perdre de points.</p>
          <p>Les points sont attribués dès que l&apos;admin saisit le score final du match.</p>
        </Section>

        <Section icon={Crown} title="Pronostic du champion">
          <p>
            Pour chaque division, tu peux aussi désigner le futur champion.{' '}
            <strong className="text-white">30 points</strong> si ton choix remporte le titre.
          </p>
          <p>Ce pronostic doit être fait avant la date limite fixée pour chaque division.</p>
        </Section>

        <p className="text-xs text-[#7C8AAE] text-center pt-2">Bonne chance et que le meilleur pronostiqueur gagne !</p>
      </div>
    </div>
  );
}
