function LogoDot({ team }) {
  if (team?.logo_url) {
    return (
      <img
        src={team.logo_url}
        alt=""
        className="rounded-full object-cover"
        style={{ width: 16, height: 16 }}
      />
    );
  }
  return (
    <span
      className="rounded-full bg-[#0A1F44] inline-flex items-center justify-center text-[9px]"
      style={{ width: 16, height: 16 }}
    >
      {team?.name?.[0]}
    </span>
  );
}

export default function WinnerPicker({ home, away, value, onChange, disabled }) {
  const opts = [
    { key: 'home', label: home?.name, team: home },
    { key: 'draw', label: 'Nul', team: null },
    { key: 'away', label: away?.name, team: away },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {opts.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            disabled={disabled}
            onClick={() => onChange(opt.key)}
            className={
              'flex items-center justify-center gap-1.5 px-2 py-2 rounded-md condensed text-sm font-semibold border disabled:opacity-60 ' +
              (active
                ? 'bg-[#EF4135] text-[#F7F7F5] border-[#EF4135]'
                : 'bg-[#153A70] text-[#B7C1DA] border-[#2B4A82]')
            }
          >
            {opt.team && <LogoDot team={opt.team} />}
            <span className="truncate">{opt.key === 'draw' ? 'NUL' : opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
