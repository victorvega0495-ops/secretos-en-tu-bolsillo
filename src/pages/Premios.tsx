import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Download, Share2, Trophy, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImage } from "@/lib/mediaUrl";

const BUCKET = "campaign-assets";
const CAMPAIGN_KEY = "premios-global";
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

interface SlotData {
  imageUrl: string;
  label: string;
}

const Premios = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(checkAdmin);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      saveAdminSession();
      setShowPasswordDialog(false);
      setPassword("");
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Banner state
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);

  // Prize slots
  const [slots, setSlots] = useState<Record<number, SlotData>>({});
  const [totalSlots, setTotalSlots] = useState(0);
  const [uploading, setUploading] = useState<number | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Premios | Rally Calzado Dama";
  }, []);

  // Load data
  useEffect(() => {
    supabase
      .from("day_assets")
      .select("*")
      .eq("campaign", CAMPAIGN_KEY)
      .eq("day_number", 0)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<number, SlotData> = {};
        let maxIdx = -1;
        data.forEach((r: any) => {
          if (r.asset_type === "banner") {
            setBannerUrl(r.storage_url || "");
          } else if (r.asset_type.startsWith("premio_")) {
            const idx = parseInt(r.asset_type.replace("premio_", ""), 10);
            if (!isNaN(idx)) {
              map[idx] = {
                imageUrl: r.storage_url || "",
                label: r.product_id || "",
              };
              if (idx > maxIdx) maxIdx = idx;
            }
          }
        });
        setSlots(map);
        setTotalSlots(Math.max(0, maxIdx + 1));
      });
  }, []);

  // Lightbox escape
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxIdx(null); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [lightboxIdx]);

  // Banner upload
  const uploadBanner = useCallback(async (file: File) => {
    setBannerUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${CAMPAIGN_KEY}/banner.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setBannerUploading(false); return; }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = urlData.publicUrl + `?t=${Date.now()}`;
    await supabase.from("day_assets").upsert({
      campaign: CAMPAIGN_KEY,
      day_number: 0,
      asset_type: "banner",
      storage_url: url,
      file_name: file.name,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "campaign,day_number,asset_type" });
    setBannerUrl(url);
    setBannerUploading(false);
  }, []);

  // Prize upload
  const uploadPrize = useCallback(async (idx: number, file: File) => {
    setUploading(idx);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${CAMPAIGN_KEY}/premios/${idx}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setUploading(null); return; }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = urlData.publicUrl;
    await supabase.from("day_assets").upsert({
      campaign: CAMPAIGN_KEY,
      day_number: 0,
      asset_type: `premio_${idx}`,
      storage_url: url,
      file_name: file.name,
      product_id: slots[idx]?.label || "",
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "campaign,day_number,asset_type" });
    setSlots((prev) => ({ ...prev, [idx]: { imageUrl: url, label: prev[idx]?.label || "" } }));
    setUploading(null);
  }, [slots]);

  // Delete prize
  const deletePrize = useCallback(async (idx: number) => {
    await supabase.from("day_assets").delete().eq("campaign", CAMPAIGN_KEY).eq("day_number", 0).eq("asset_type", `premio_${idx}`);
    setSlots((prev) => { const next = { ...prev }; delete next[idx]; return next; });
  }, []);

  // Save label
  const saveLabel = useCallback(async (idx: number, value: string) => {
    setSlots((prev) => ({ ...prev, [idx]: { imageUrl: prev[idx]?.imageUrl || "", label: value } }));
    const existing = slots[idx];
    await supabase.from("day_assets").upsert({
      campaign: CAMPAIGN_KEY,
      day_number: 0,
      asset_type: `premio_${idx}`,
      storage_url: existing?.imageUrl || "",
      file_name: "",
      product_id: value,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "campaign,day_number,asset_type" });
  }, [slots]);

  // Add slot
  const addSlot = () => setTotalSlots((prev) => prev + 1);

  // Share/download
  const shareFile = useCallback(async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], name, { type: blob.type || "image/jpeg" });
      if (navigator.share) { await navigator.share({ files: [file] }); }
      else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); }
    } catch { /* cancelled */ }
  }, []);

  const downloadFile = useCallback(async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    } catch { /* failed */ }
  }, []);

  const lightboxSlot = lightboxIdx !== null ? slots[lightboxIdx] : null;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div
        className="px-4 py-8 text-center text-white relative"
        style={{ background: "linear-gradient(135deg, hsl(45 100% 50%), hsl(35 100% 45%), hsl(25 100% 40%))" }}
      >
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <button onClick={() => navigate("/")} className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => navigate("/")} className="text-xs text-white/70 hover:text-white transition-colors">Inicio</button>
        </div>
        <Trophy className="w-10 h-10 mx-auto mb-2 text-yellow-200" />
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-2">Premios</h1>
        <p className="text-sm text-white/80 mt-1">Conoce lo que puedes ganar</p>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-8">

        {/* Section 1: Banner */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Viaje de premiacion</h2>
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card aspect-[16/9]">
            {bannerUrl ? (
              <>
                <img src={optimizeImage(bannerUrl, 1200)} alt="Viaje de premiacion" loading="eager" decoding="async" className="w-full h-full object-cover" />
                {isAdmin && (
                  <label className="absolute bottom-3 right-3 cursor-pointer">
                    <div className="flex items-center gap-1.5 bg-black/60 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-black/80 transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Cambiar
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadBanner(e.target.files[0]); }} />
                  </label>
                )}
              </>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-muted-foreground hover:text-foreground transition-colors gap-2">
                {bannerUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isAdmin ? (
                  <>
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Subir imagen del viaje</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadBanner(e.target.files[0]); }} />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Proximamente</span>
                )}
              </label>
            )}
          </div>
        </section>

        {/* Section 2: Mosaico de premios */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Premios</h2>

          {totalSlots === 0 && !isAdmin ? (
            <p className="text-sm text-muted-foreground text-center py-8">Proximamente se anunciaran los premios</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {Array.from({ length: totalSlots }, (_, i) => {
                const slot = slots[i];
                return (
                  <div key={i} className="relative rounded-xl border border-border bg-card overflow-hidden aspect-square flex flex-col">
                    {slot?.imageUrl ? (
                      <div
                        className="relative flex-1 cursor-pointer"
                        onClick={() => !isAdmin && setLightboxIdx(i)}
                      >
                        <img src={optimizeImage(slot.imageUrl, 400)} alt={slot.label || `Premio ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePrize(i); }}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isAdmin && slot.label && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2.5 py-1.5">
                            <p className="text-white text-xs font-bold truncate">{slot.label}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="flex-1 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                        {uploading === i ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isAdmin ? (
                          <>
                            <Upload className="w-5 h-5" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadPrize(i, e.target.files[0]); }} />
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </label>
                    )}
                    {isAdmin && (
                      <div className="p-1.5 bg-muted/50">
                        <input
                          type="text"
                          placeholder="Nombre del premio"
                          value={slot?.label || ""}
                          onChange={(e) => saveLabel(i, e.target.value)}
                          className="w-full text-[10px] px-1.5 py-1 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add slot - admin only */}
          {isAdmin && (
            <Button variant="outline" size="sm" className="w-full" onClick={addSlot}>
              <Plus className="w-4 h-4 mr-1.5" /> Agregar premio
            </Button>
          )}
        </section>

        {/* Admin toggle */}
        {!isAdmin && (
          <div className="text-center pt-4">
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <Lock className="w-3 h-3" /> Admin
            </button>
          </div>
        )}
        {isAdmin && (
          <p className="text-center text-xs text-green-600 font-medium">Modo admin activo</p>
        )}
      </div>

      {/* Password dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordDialog(false)}>
          <div className="bg-background rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-center">Acceso Admin</h3>
            <input
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {passwordError && <p className="text-destructive text-sm text-center">Contrasena incorrecta</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPasswordDialog(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handlePasswordSubmit}>Entrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && lightboxSlot?.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSlot.imageUrl}
            alt={lightboxSlot.label || `Premio ${lightboxIdx + 1}`}
            className="max-h-[65vh] max-w-[90vw] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxSlot.label && (
            <p className="text-white font-bold mt-4 text-lg" onClick={(e) => e.stopPropagation()}>
              {lightboxSlot.label}
            </p>
          )}
          <div className="flex items-center gap-3 mt-4 w-full max-w-sm px-5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => downloadFile(lightboxSlot.imageUrl, `${lightboxSlot.label || `premio-${lightboxIdx! + 1}`}.jpg`)}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" /> Descargar
            </button>
            <button
              onClick={() => shareFile(lightboxSlot.imageUrl, `${lightboxSlot.label || `premio-${lightboxIdx! + 1}`}.jpg`)}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl shadow-lg"
              style={{ background: "linear-gradient(135deg, hsl(330 85% 55%), hsl(275 65% 50%))" }}
            >
              <Share2 className="w-4 h-4" /> Compartir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Premios;
