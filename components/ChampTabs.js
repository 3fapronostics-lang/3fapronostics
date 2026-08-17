'use client';

export const CHAMPS = [
  { id: 'elite', label: 'Ligue Élite' },
  { id: 'd1', label: 'Division 1' },
  { id: 'd2', label: 'Division 2' },
];

export default function ChampTabs({ value, onChange }) {
  return (
    <div className="flex gap-1 mb-6">
      {CHAMPS.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={
              'condensed text-sm font-medium px-3 py-1.5 rounded-full border ' +
              (active
                ? 'bg-[#3B7DD8] text-[#0A1F44] border-[#3B7DD8]'
                : 'text-[#B7C1DA] border-[#2B4A82]')
            }
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
