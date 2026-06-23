import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Video, Link2, Search, Film, Trash2 } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "../constants";
import { GI_META } from "../techniques";
import type { DisciplineId, Technique } from "../types";
import StatCard from "../components/StatCard";
import { Modal } from "../components/Overlay";
import { SectionCard } from "../components/EmptyState";
import { asset } from "../../asset";

const DISCS: DisciplineId[] = ["bjj", "mma", "kickboxing", "boxe"];

function youtubeId(url: string): string | null {
  const valid = (id: string | null | undefined) => (id && /^[\w-]{11}$/.test(id) ? id : null);
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return valid(u.pathname.slice(1).split("/")[0]);
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return valid(u.searchParams.get("v"));
      const seg = u.pathname.split("/").filter(Boolean); // embed/ID, shorts/ID, v/ID
      if (["embed", "shorts", "v"].includes(seg[0])) return valid(seg[1]);
    }
    return null;
  } catch {
    return null;
  }
}

// Chemin local (/videos/…) → préfixé par le base path ; URL absolue → telle quelle
function resolveSrc(url: string): string {
  return /^(https?:|data:)/.test(url) ? url : asset(url);
}

function VideoPlayer({ url }: { url: string }) {
  const yt = youtubeId(url);
  if (yt) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${yt}`} title="Vidéo technique" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return <video className="aspect-video w-full rounded-xl bg-black" src={resolveSrc(url)} controls playsInline />;
}

export default function VideoLibrary() {
  const { db, setTechniqueVideo } = useStore();
  const [disc, setDisc] = useState<DisciplineId>("bjj");
  const [onlyVideo, setOnlyVideo] = useState(false);
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState<Technique | null>(null);
  const [editing, setEditing] = useState<Technique | null>(null);
  const [url, setUrl] = useState("");

  const withVideo = db.techniques.filter((t) => t.videoUrl);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.techniques
      .filter((x) => x.discipline === disc)
      .filter((x) => !onlyVideo || !!x.videoUrl)
      .filter((x) => !t || x.name.toLowerCase().includes(t))
      .sort((a, b) => Number(!!b.videoUrl) - Number(!!a.videoUrl) || a.name.localeCompare(b.name));
  }, [db.techniques, disc, onlyVideo, q]);

  const openEdit = (t: Technique) => { setEditing(t); setUrl(t.videoUrl || ""); };
  const saveUrl = () => { if (editing) setTechniqueVideo(editing.id, url.trim() || null); setEditing(null); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide md:text-5xl">VIDÉOTHÈQUE</h1>
        <p className="mt-1 text-sm text-ash">Vidéos de démonstration des techniques — MP4 ou YouTube.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Techniques avec vidéo" value={withVideo.length} accent="#ff3d2e" icon={<Film className="h-4 w-4" />} index={0} />
        <StatCard label="Vidéos BJJ" value={db.techniques.filter((t) => t.discipline === "bjj" && t.videoUrl).length} accent="#3aa0ff" icon={<Video className="h-4 w-4" />} index={1} />
        <StatCard label="Catalogue total" value={db.techniques.length} accent="#3ddc84" icon={<Video className="h-4 w-4" />} index={2} />
      </div>

      <SectionCard>
        <div className="flex flex-wrap items-center gap-2">
          {DISCS.map((d) => (
            <button key={d} onClick={() => setDisc(d)} className={`rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${disc === d ? "border-ember bg-ember text-white" : "border-white/10 text-ash hover:text-bone"}`}>
              {DISCIPLINE_LABELS[d]}
            </button>
          ))}
          <button onClick={() => setOnlyVideo((v) => !v)} className={`ml-1 rounded-full px-3 py-1.5 text-xs font-semibold ${onlyVideo ? "bg-ember/15 text-ember" : "text-ash hover:text-bone"}`}>
            Avec vidéo seulement
          </button>
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="w-52 rounded-xl border border-white/10 bg-ink py-2 pl-9 pr-3 text-sm text-bone outline-none focus:border-ember" />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 9) * 0.03 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-coal">
            <button onClick={() => t.videoUrl && setPlaying(t)} disabled={!t.videoUrl}
              className="relative flex aspect-video w-full items-center justify-center bg-ink">
              {t.videoUrl ? (
                <>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-ember/90 text-white shadow-lg transition-transform hover:scale-110"><Play className="h-5 w-5" fill="currentColor" /></span>
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                </>
              ) : (
                <span className="flex flex-col items-center gap-1 text-ash"><Video className="h-6 w-6" /><span className="text-[11px]">Pas de vidéo</span></span>
              )}
            </button>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-base leading-tight tracking-wide text-bone">{t.name}</span>
                <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ color: GI_META[t.gi].color, background: GI_META[t.gi].color + "22" }}>{GI_META[t.gi].short}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-ash">
                <span className="rounded bg-white/5 px-1.5 py-0.5">{t.category}</span>
                <span className="h-1 w-1 rounded-full" style={{ background: DISCIPLINE_COLORS[t.discipline] }} />
              </div>
              <button onClick={() => openEdit(t)} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ash hover:text-ember">
                <Link2 className="h-3.5 w-3.5" /> {t.videoUrl ? "Modifier la vidéo" : "Ajouter une vidéo"}
              </button>
            </div>
          </motion.div>
        ))}
        {list.length === 0 && <p className="col-span-full py-10 text-center text-sm text-ash">Aucune technique pour ces filtres.</p>}
      </div>

      {/* Lecteur */}
      <Modal open={!!playing} onClose={() => setPlaying(null)} title={playing?.name} width="max-w-2xl">
        {playing?.videoUrl && (
          <div className="space-y-3">
            <VideoPlayer url={playing.videoUrl} />
            <div className="flex items-center gap-2 text-sm text-ash">
              <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: GI_META[playing.gi].color, background: GI_META[playing.gi].color + "22" }}>{GI_META[playing.gi].short}</span>
              <span>{playing.category} · {playing.position}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Édition du lien */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Vidéo — ${editing?.name ?? ""}`}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Lien de la vidéo (MP4 ou YouTube)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… .mp4 ou https://youtu.be/…" className="field" autoFocus />
            <p className="mt-1.5 text-xs text-ash">Colle un lien MP4 direct ou une URL YouTube. La vidéo se lit dans la vidéothèque et le portail membre.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={saveUrl} className="btn-primary flex-1">Enregistrer</button>
            {editing?.videoUrl && (
              <button onClick={() => { setTechniqueVideo(editing.id, null); setEditing(null); }} className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 px-4 text-sm font-semibold text-ember hover:border-ember">
                <Trash2 className="h-4 w-4" /> Retirer
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
