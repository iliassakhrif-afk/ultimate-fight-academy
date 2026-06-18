import { motion } from "framer-motion";
import CountUp from "./CountUp";
import Sparkline from "./charts/Sparkline";

interface Props {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: { value: number; positive?: boolean };
  spark?: number[];
  accent?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  index?: number;
}

export default function StatCard({ label, value, format, delta, spark, accent = "#ff3d2e", icon, onClick, index = 0 }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-coal p-5 text-left transition-colors ${onClick ? "hover:border-white/25 cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-ash">{label}</span>
        {icon && <span className="text-ash/70" style={{ color: accent }}>{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-display text-3xl leading-none md:text-[2rem]">
          <CountUp value={value} format={format} />
        </span>
        {spark && spark.length > 1 && <Sparkline data={spark} color={accent} />}
      </div>
      {delta && (
        <span className={`text-xs font-semibold ${delta.positive ? "text-[#3ddc84]" : "text-ember"}`}>
          {delta.positive ? "▲" : "▼"} {Math.abs(delta.value)}%
          <span className="ml-1 font-normal text-ash">vs mois dernier</span>
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl opacity-0 transition-opacity group-hover:opacity-100" style={{ background: accent }} />
    </motion.button>
  );
}
