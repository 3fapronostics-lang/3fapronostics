export default function FormDots({ results }) {
  if (!results || results.length === 0) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      {results.map((r, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: r === 'W' ? '#22C55E' : r === 'L' ? '#EF4135' : '#8B96AE',
          }}
          title={r === 'W' ? 'Victoire' : r === 'L' ? 'Défaite' : 'Nul'}
        />
      ))}
    </div>
  );
}
