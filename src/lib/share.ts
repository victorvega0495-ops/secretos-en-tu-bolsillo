import { track } from "@vercel/analytics";

/** Fire-and-forget analytics event */
const trackEvent = (name: string, props?: Record<string, string>) => {
  try { track(name, props); } catch { /* noop */ }
};

export const shareOrDownload = async (url: string, fileName: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const cleanName = fileName.includes(".") ? fileName : `contenido.${ext}`;
    const mimeType = blob.type || `image/${ext === "jpg" ? "jpeg" : ext}`;
    const file = new File([blob], cleanName, { type: mimeType });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      trackEvent("share", { fileName: cleanName, type: mimeType.startsWith("video") ? "video" : "image" });
    } else {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = cleanName;
      a.click();
      URL.revokeObjectURL(blobUrl);
      trackEvent("download", { fileName: cleanName, type: mimeType.startsWith("video") ? "video" : "image" });
    }
  } catch {
    // user cancelled share
  }
};

export const downloadFile = async (url: string, fileName: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(blobUrl);
    trackEvent("download", { fileName, type: blob.type.startsWith("video") ? "video" : "image" });
  } catch {
    // download failed
  }
};
