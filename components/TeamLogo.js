export default function TeamLogo({ team, size = 32 }) {
  if (team?.logo_url) {
    return (
      <img
        src={team.logo_url}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border: '1px solid #2B4A82' }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center mono shrink-0 bg-[#153A70] border border-[#2B4A82] text-[#B7C1DA]"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {team?.name ? team.name[0].toUpperCase() : '?'}
    </div>
  );
}
