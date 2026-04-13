import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Clock, Upload, Loader2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImage } from "@/lib/mediaUrl";

interface ClassRow {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  week_number: number | null;
  duration_minutes: number;
  is_published: boolean;
}

const ADMIN_KEY = "rally-admin";
const BUCKET = "campaign-assets";

const checkAdmin = (): boolean => {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return false;
    const { expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { localStorage.removeItem(ADMIN_KEY); return false; }
    return true;
  } catch { return false; }
};

const CATEGORIES = ["Todas", "Prospección", "Cierre", "Redes Sociales", "Seguimiento", "Técnicas de Venta"];

const Classes = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    document.title = "Clases | Price Shoes";
    setIsAdmin(checkAdmin());
  }, []);

  useEffect(() => {
    supabase
      .from("classes")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setClasses(data as ClassRow[]);
        setLoading(false);
      });
  }, []);

  const uploadThumbnail = useCallback(async (classId: string, file: File) => {
    setUploadingId(classId);
    const path = `classes/thumb_${classId}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) { setUploadingId(null); return; }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = urlData.publicUrl;
    await supabase.from("classes").update({ thumbnail_url: url }).eq("id", classId);
    setClasses((prev) => prev.map((c) => c.id === classId ? { ...c, thumbnail_url: url } : c));
    setUploadingId(null);
  }, []);

  const filtered = classes.filter((c) => {
    if (selectedCategory !== "Todas" && c.category !== selectedCategory) return false;
    if (selectedWeek !== null && c.week_number !== selectedWeek) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="px-4 py-6 text-center text-white relative" style={{ background: "linear-gradient(135deg, hsl(330 85% 55%), hsl(275 65% 50%), hsl(220 85% 55%))" }}>
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <button onClick={() => navigate("/")} className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => navigate("/")} className="text-xs text-white/70 hover:text-white transition-colors">Inicio</button>
        </div>
        <button
          onClick={() => {
            if (isAdmin) {
              localStorage.removeItem(ADMIN_KEY);
              setIsAdmin(false);
            } else {
              setShowPwDialog(true);
            }
          }}
          className="absolute right-3 top-3 z-20 flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          {isAdmin ? "Salir Admin" : "Admin"}
        </button>
        <h1 className="font-display text-xl font-bold mt-2">Clases</h1>
        <p className="text-xs text-white/80 mt-1">Aprende las mejores técnicas de venta</p>
      </div>

      {/* Admin password dialog */}
      {showPwDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPwDialog(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-xs space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-center text-foreground">Acceso Admin</h3>
            <input
              type="password"
              placeholder="Contraseña"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (pwInput === "priceshoes2026") {
                    localStorage.setItem(ADMIN_KEY, JSON.stringify({ expiresAt: Date.now() + 24 * 60 * 60 * 1000 }));
                    setIsAdmin(true);
                    setShowPwDialog(false);
                  }
                  setPwInput("");
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                if (pwInput === "priceshoes2026") {
                  localStorage.setItem(ADMIN_KEY, JSON.stringify({ expiresAt: Date.now() + 24 * 60 * 60 * 1000 }));
                  setIsAdmin(true);
                  setShowPwDialog(false);
                }
                setPwInput("");
              }}
              className="w-full py-2 rounded-lg text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, hsl(330 85% 55%), hsl(275 65% 50%))" }}
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 py-4 max-w-2xl mx-auto space-y-3">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              style={selectedCategory === cat ? { background: "linear-gradient(135deg, hsl(330 85% 55%), hsl(275 65% 50%))" } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Week filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedWeek(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              selectedWeek === null ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            }`}
          >
            Todas
          </button>
          {[1, 2, 3, 4, 5, 6].map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                selectedWeek === w ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              }`}
            >
              Semana {w}
            </button>
          ))}
        </div>
      </div>

      {/* Classes grid */}
      <div className="px-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No hay clases disponibles con estos filtros</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((cls) => {
              const thumb = cls.thumbnail_url;
              const isUploading = uploadingId === cls.id;
              return (
                <div
                  key={cls.id}
                  className="flex gap-4 rounded-xl border border-border overflow-hidden bg-card hover:shadow-lg transition-all"
                >
                  {/* Thumbnail area */}
                  <div className="relative w-36 h-24 flex-shrink-0">
                    {isUploading ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : thumb ? (
                      <a href={cls.youtube_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <img
                          src={optimizeImage(thumb, 400)}
                          alt={cls.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-5 h-5 text-foreground ml-0.5" />
                          </div>
                        </div>
                      </a>
                    ) : (
                      <a href={cls.youtube_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                      </a>
                    )}

                    {/* Admin upload overlay */}
                    {isAdmin && !isUploading && (
                      <label className="absolute bottom-1 left-1 cursor-pointer z-10">
                        <div className="flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-md hover:bg-black/80 transition-colors">
                          <Upload className="w-3 h-3" /> Cover
                        </div>
                        <input
                          ref={(el) => { fileInputRefs.current[cls.id] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadThumbnail(cls.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Info */}
                  <a
                    href={cls.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 pr-3 space-y-1"
                  >
                    <h3 className="font-display font-bold text-sm text-foreground line-clamp-2">{cls.title}</h3>
                    <div className="flex items-center gap-2">
                      {cls.category && (
                        <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{cls.category}</Badge>
                      )}
                      {cls.duration_minutes > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {cls.duration_minutes} min
                        </span>
                      )}
                    </div>
                    {cls.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{cls.description}</p>
                    )}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;
