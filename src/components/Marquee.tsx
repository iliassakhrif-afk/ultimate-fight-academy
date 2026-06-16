const words = ["BJJ", "MMA", "KICKBOXING", "BOXE", "NO-GI", "GI", "KIDS", "WOMEN ONLY", "DISCIPLINE", "RESPECT"];

export default function Marquee() {
  const row = [...words, ...words];
  return (
    <div className="relative border-y border-white/10 bg-ember py-5 text-ink">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {row.map((w, i) => (
          <span key={i} className="mx-6 flex items-center gap-6 font-display text-2xl tracking-wide md:text-3xl">
            {w}
            <span className="text-ink/40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
