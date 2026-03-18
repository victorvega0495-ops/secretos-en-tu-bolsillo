import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditableMessagesProps {
  campaignId: string;
  dayNumber: number;
  section: string; // e.g. "video_ideas", "image_ideas", "referral_copy"
  isAdmin?: boolean;
  defaultMessages: string[];
  /** If provided, each message gets a label badge + copy button (for referral-style cards) */
  labels?: string[];
  labelColors?: string[];
  showCopyButton?: boolean;
  title?: string;
}

interface MessageData {
  slot_index: number;
  message: string;
  label: string;
}

const EditableMessages = ({
  campaignId,
  dayNumber,
  section,
  isAdmin,
  defaultMessages,
  labels,
  labelColors,
  showCopyButton,
  title = "💡 Ideas para arrancar",
}: EditableMessagesProps) => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    supabase
      .from("day_messages")
      .select("slot_index, message, label")
      .eq("campaign", campaignId)
      .eq("day_number", dayNumber)
      .eq("section", section)
      .order("slot_index", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data as MessageData[]);
        } else {
          // Initialize with defaults
          setMessages(defaultMessages.map((msg, i) => ({
            slot_index: i,
            message: msg,
            label: labels?.[i] || "",
          })));
        }
        setLoaded(true);
      });
  }, [campaignId, dayNumber, section]);

  const saveMessage = useCallback((slotIndex: number, message: string, label: string) => {
    clearTimeout(saveTimers.current[slotIndex]);
    saveTimers.current[slotIndex] = setTimeout(async () => {
      await supabase.from("day_messages").upsert(
        {
          campaign: campaignId,
          day_number: dayNumber,
          section,
          slot_index: slotIndex,
          message,
          label,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "campaign,day_number,section,slot_index" }
      );
    }, 800);
  }, [campaignId, dayNumber, section]);

  const updateMessage = (idx: number, value: string) => {
    setMessages((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], message: value };
      saveMessage(next[idx].slot_index, value, next[idx].label);
      return next;
    });
  };

  const updateLabel = (idx: number, value: string) => {
    setMessages((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], label: value };
      saveMessage(next[idx].slot_index, next[idx].message, value);
      return next;
    });
  };

  const addMessage = () => {
    const nextSlot = messages.length > 0 ? Math.max(...messages.map((m) => m.slot_index)) + 1 : 0;
    const newMsg: MessageData = { slot_index: nextSlot, message: "", label: "" };
    setMessages((prev) => [...prev, newMsg]);
    saveMessage(nextSlot, "", "");
  };

  const deleteMessage = async (idx: number) => {
    const msg = messages[idx];
    await supabase
      .from("day_messages")
      .delete()
      .eq("campaign", campaignId)
      .eq("day_number", dayNumber)
      .eq("section", section)
      .eq("slot_index", msg.slot_index);
    setMessages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  if (!loaded) return null;

  // Socia view with copy buttons (referral-style cards)
  if (showCopyButton && !isAdmin) {
    return (
      <div className="w-full space-y-4">
        {messages.filter((m) => m.message).map((msg, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3" style={{ background: "hsl(var(--muted) / 0.3)" }}>
            <div className="flex items-center justify-between">
              {msg.label && (
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white" style={{ background: labelColors?.[i] || "hsl(330 85% 55%)" }}>
                  {msg.label}
                </span>
              )}
              <button
                onClick={() => handleCopy(msg.message, i)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={copiedIdx === i
                  ? { background: "hsl(150 60% 45%)", color: "white" }
                  : { background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }
                }
              >
                {copiedIdx === i ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{msg.message}</p>
          </div>
        ))}
      </div>
    );
  }

  // Admin view with copy buttons (referral-style)
  if (showCopyButton && isAdmin) {
    return (
      <div className="w-full space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3 relative" style={{ background: "hsl(var(--muted) / 0.3)" }}>
            <button
              onClick={() => deleteMessage(i)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              placeholder="Etiqueta (ej: Casual)"
              value={msg.label}
              onChange={(e) => updateLabel(i, e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
            <Textarea
              placeholder="Escribe el mensaje..."
              value={msg.message}
              onChange={(e) => updateMessage(i, e.target.value)}
              className="text-sm min-h-[80px]"
            />
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addMessage}>
          <Plus className="w-4 h-4 mr-1.5" />
          Agregar mensaje
        </Button>
      </div>
    );
  }

  // Standard "Ideas para arrancar" — socia view
  if (!isAdmin) {
    const visibleMessages = messages.filter((m) => m.message);
    if (visibleMessages.length === 0) return null;
    return (
      <div className="mt-6 px-5 w-full max-w-sm">
        <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {visibleMessages.map((msg, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">"{msg.message}"</p>
          ))}
        </div>
      </div>
    );
  }

  // Standard "Ideas para arrancar" — admin view
  return (
    <div className="mt-6 px-5 w-full max-w-sm">
      <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--muted) / 0.5)" }}>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {messages.map((msg, i) => (
          <div key={i} className="relative">
            <button
              onClick={() => deleteMessage(i)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center z-10"
            >
              <X className="w-3 h-3" />
            </button>
            <Textarea
              value={msg.message}
              onChange={(e) => updateMessage(i, e.target.value)}
              placeholder="Escribe un mensaje de inspiración..."
              className="text-sm min-h-[50px] pr-6"
            />
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addMessage}>
          <Plus className="w-4 h-4 mr-1.5" />
          Agregar mensaje
        </Button>
      </div>
    </div>
  );
};

export default EditableMessages;
