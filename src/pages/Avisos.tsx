import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Loader2, Megaphone, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImage, videoPoster } from "@/lib/mediaUrl";

const BUCKET = "campaign-assets";
const CAMPAIGN_KEY = "avisos-global";
const ADMIN_KEY = "rally-admin";
const ADMIN_PASSWORD = "priceshoes2026";
const ADMIN_EXPIRY_HOURS = 24;

const checkAdmin = (): boolean => {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return false;
    const { expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { localStorage.removeItem(ADMIN_KEY); return false; }
    return true;
  } catch { return false; }
};

const saveAdminSession = () => {
  localStorage.setItem(ADMIN_KEY, JSON.stringify({
    expiresAt: Date.now() + ADMIN_EXPIRY_HOURS * 60 * 60 * 1000,
  }));
};

const isVideoUrl = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url);

interface AvisoSlot {
  url: string;
  fileName: string;
  title: string;
}

const Avisos = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [slots, setSlots] = useState<Record<number, AvisoSlot>>({});
  const [totalSlots, setTotalSlots] = useState(0);
  const [uploading, setUploading] = useState<number | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Avisos y Tutoriales | Rally Calzado Dama";
    setIsAdmin(checkAdmin());
  }, []);

  // Load avisos from DB
  useEffect(() => {
    supabase
      .from("day_assets")
      .select("*")
      .eq("campaign", CAMPAIGN_KEY)
      .eq("day_number", 0)
      .like("asset_type", "aviso_%")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<number, AvisoSlot> = {};
        let maxIdx = -1;
        data.forEach((r: any) => {
          const idx = parseInt(r.asset_type.replace("aviso_", ""), 10);
          if (!isNaN(idx) && r.storage_url) {
            map[idx] = {
              url: r.storage_url,
              fileName: r.file_name || "",
              title: r.product_description || "",
            };
            if (idx > maxIdx) maxIdx = idx;
          }
        });
        setSlots(map);
        setTotalSlots(maxIdx + 1);
      });
  }, []);

  const handleAdminLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      saveAdminSession();
      setIsAdmin(true);
      setShowPwDialog(false);
      setPwInput("");
    } else {
      setPwInput("");
    }
  };

  const uploadAviso = useCallback(async (idx: number, file: File) => {
    setUploading(idx);
    const path = `avisos/${idx}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) { setUploading(null); return; }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = urlData.publicUrl;
    await supabase.from("day_assets").upsert({
      campaign: CAMPAIGN_KEY,
      day_number: 0,
      asset_type: `aviso_${idx}`,
      storage_url: url,
      file_name: file.name,
      product_id: "",
      product_description: slots[idx]?.title || "",
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "campaign,day_number,asset_type" });
    setSlots((prev) => ({ ...prev, [idx]: { url, fileName: file.name, title: prev[idx]?.title || "" } }));
    setUploading(null);
  }, [slots]);

  const updateTitle = useCallback(async (idx: number, title: string) => {
    setSlots((prev) => ({ ...prev, [idx]: { ...prev[idx], title } }));
    await supabase.from("day_assets").upsert({
      campaign: CAMPAIGN_KEY,
      day_number: 0,
      asset_type: `aviso_${idx}`,
      storage_url: slots[idx]?.url || "",
      file_name: slots[idx]?.fileName || "",
      product_id: "",
      product_description: title,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "campaign,day_number,asset_type" });
  }, [slots]);

  const deleteAviso = useCallback(async (idx: number) => {
    await supabase.from("day_assets").delete()
      .eq("campaign", CAMPAIGN_KEY).eq("day_number", 0).eq("asset_type", `aviso_${idx}`);
    setSlots((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }, []);

  const addSlot = () => setTotalSlots((prev) => prev + 1);

  // Ordered slots (newest first)
  const orderedIdxs = Array.from({ length: totalSlots }, (_, i) => i).reverse().filter((i) => slots[i]);

  const lightboxSlot = lightboxIdx !== null ? slots[lightboxIdx] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-4 py-6 text-white relative"
        style={{ background: "linear-gradient(135deg, hsl(210 85% 50%), hsl(250 65% 55%))" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-xs text-white/70 hover:text-white transition-colors"
          >
            Inicio
          </button>
        </div>
        <div className="text-center mt-2">
          <Megaphone className="w-8 h-8 mx-auto mb-1 text-white/80" />
          <h1 className="font-display text-xl font-bold">Avisos y Tutoriales</h1>
          <p className="text-xs text-white/60 mt-1">Información importante y guías</p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowPwDialog(true)}
            className="absolute top-4 right-4 text-white/40 text-[10px] hover:text-white/80"
          >
            admin
          </button>
        )}
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
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              autoFocus
            />
            <Button variant="gradient" className="w-full" onClick={handleAdminLogin}>
              Entrar
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {/* Admin: add button */}
        {isAdmin && (
          <Button
            variant="outline"
            className="w-full border-dashed border-2"
            onClick={addSlot}
          >
            <Plus className="w-4 h-4 mr-2" /> Agregar aviso o tutorial
          </Button>
        )}

        {/* Empty state */}
        {orderedIdxs.length === 0 && !isAdmin && totalSlots === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No hay avisos por ahora</p>
            <p className="text-xs text-muted-foreground mt-1">Vuelve pronto para ver novedades</p>
          </div>
        )}

        {/* Upload slots (admin, empty slots at top) */}
        {isAdmin && Array.from({ length: totalSlots }, (_, i) => i).reverse().filter((i) => !slots[i]).map((i) => (
          <div key={`empty-${i}`} className="rounded-2xl border-2 border-dashed border-border overflow-hidden">
            <label className="flex flex-col items-center justify-center py-12 cursor-pointer text-muted-foreground hover:text-foreground transition-colors gap-2">
              {uploading === i ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Subir imagen o video</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, MP4, MOV</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) uploadAviso(i, e.target.files[0]); }}
                  />
                </>
              )}
            </label>
          </div>
        ))}

        {/* Avisos feed */}
        {orderedIdxs.map((i) => {
          const slot = slots[i];
          if (!slot) return null;
          const isVideo = isVideoUrl(slot.url);
          return (
            <div key={i} className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card">
              {/* Media */}
              <div
                className="relative w-full cursor-pointer"
                onClick={() => !isAdmin && setLightboxIdx(i)}
              >
                {isVideo ? (
                  <video
                    src={videoPoster(slot.url)}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-h-[75vh] object-contain bg-black"
                  />
                ) : (
                  <img
                    src={optimizeImage(slot.url, 900)}
                    alt={slot.title || `Aviso ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full object-contain"
                  />
                )}
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteAviso(i); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isAdmin && (
                  <label className="absolute top-2 left-2 cursor-pointer">
                    <div className="flex items-center gap-1 bg-black/60 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-black/80 transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Cambiar
                    </div>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) uploadAviso(i, e.target.files[0]); }}
                    />
                  </label>
                )}
              </div>

              {/* Title */}
              {isAdmin ? (
                <div className="p-3">
                  <input
                    type="text"
                    value={slot.title}
                    onChange={(e) => updateTitle(i, e.target.value)}
                    placeholder="Título del aviso (opcional)"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              ) : slot.title ? (
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground">{slot.title}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Lightbox (images only) */}
      {lightboxSlot && lightboxIdx !== null && !isVideoUrl(lightboxSlot.url) && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={optimizeImage(lightboxSlot.url, 1200)}
            alt={lightboxSlot.title || "Aviso"}
            className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Avisos;
