import { initials, avatarColor } from "../store/format";

export default function Avatar({ first, last, size = 38 }: { first: string; last: string; size?: number }) {
  const color = avatarColor(first + last);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display tracking-wide text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}99)`, fontSize: size * 0.36 }}
    >
      {initials(first, last)}
    </span>
  );
}
