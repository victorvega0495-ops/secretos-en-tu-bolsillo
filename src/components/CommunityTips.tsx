import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, Loader2, MessageCircle, CornerDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tip {
  id: string;
  nickname: string;
  city: string | null;
  message: string;
  likes: number;
  day_number: number;
  created_at: string;
  parent_id: string | null;
}

interface CommunityTipsProps {
  dayNumber: number;
  campaign: string;
}

const PAGE_SIZE = 10;

const timeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
};

const CommunityTips = ({ dayNumber, campaign }: CommunityTipsProps) => {
  const { toast } = useToast();
  const [tips, setTips] = useState<Tip[]>([]);
  const [replies, setReplies] = useState<Record<string, Tip[]>>({});
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nickname, setNickname] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyNickname, setReplyNickname] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyPosting, setReplyPosting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchReplies = useCallback(async (parentIds: string[]) => {
    if (parentIds.length === 0) return;
    const { data } = await supabase
      .from("community_tips")
      .select("*")
      .in("parent_id", parentIds)
      .order("created_at", { ascending: true });
    const grouped: Record<string, Tip[]> = {};
    ((data || []) as Tip[]).forEach((r) => {
      if (!r.parent_id) return;
      if (!grouped[r.parent_id]) grouped[r.parent_id] = [];
      grouped[r.parent_id].push(r);
    });
    setReplies((prev) => ({ ...prev, ...grouped }));
  }, []);

  const fetchCount = useCallback(async () => {
    const { count } = await supabase
      .from("community_tips")
      .select("*", { count: "exact", head: true })
      .eq("campaign", campaign);
    setTotalCount(count || 0);
  }, [campaign]);

  const fetchTips = useCallback(async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    const { data } = await supabase
      .from("community_tips")
      .select("*")
      .eq("campaign", campaign)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    const rows = (data || []) as Tip[];
    if (append) {
      setTips((prev) => [...prev, ...rows]);
    } else {
      setTips(rows);
    }
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
    // Load replies for the newly fetched tips
    fetchReplies(rows.map((r) => r.id));
  }, [campaign, fetchReplies]);

  useEffect(() => {
    setTips([]);
    setReplies({});
    setHasMore(true);
    fetchTips(0, false);
    fetchCount();
  }, [campaign, fetchTips, fetchCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchTips(tips.length, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, tips.length, fetchTips]);

  const handlePost = async () => {
    if (!nickname.trim() || !message.trim()) {
      toast({ title: "Escribe tu nombre y tu tip 😊", duration: 2000 });
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("community_tips").insert({
      day_number: dayNumber,
      campaign,
      nickname: nickname.trim(),
      city: city.trim() || null,
      message: message.trim(),
    });
    if (!error) {
      setMessage("");
      toast({ title: "¡Tip compartido! ✨", duration: 2000 });
      // Reload from start to show new tip at top
      setTips([]);
      setReplies({});
      setHasMore(true);
      await fetchTips(0, false);
      fetchCount();
    }
    setPosting(false);
  };

  const handlePostReply = async (parentId: string, parentDayNumber: number) => {
    if (!replyNickname.trim() || !replyMessage.trim()) {
      toast({ title: "Escribe tu nombre y tu respuesta 😊", duration: 2000 });
      return;
    }
    setReplyPosting(true);
    const { data, error } = await supabase
      .from("community_tips")
      .insert({
        day_number: parentDayNumber,
        campaign,
        nickname: replyNickname.trim(),
        city: null,
        message: replyMessage.trim(),
        parent_id: parentId,
      })
      .select()
      .single();
    if (!error && data) {
      setReplies((prev) => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), data as Tip],
      }));
      setReplyMessage("");
      setReplyNickname("");
      setReplyingTo(null);
      setTotalCount((c) => c + 1);
      toast({ title: "¡Respuesta enviada! 💬", duration: 2000 });
    }
    setReplyPosting(false);
  };

  const handleLike = async (tipId: string, currentLikes: number) => {
    if (likedIds.has(tipId)) return;
    setLikedIds((prev) => new Set(prev).add(tipId));
    setTips((prev) =>
      prev.map((t) => (t.id === tipId ? { ...t, likes: t.likes + 1 } : t))
    );
    await supabase
      .from("community_tips")
      .update({ likes: currentLikes + 1 })
      .eq("id", tipId);
  };

  return (
    <section className="space-y-4">
      {/* Post form */}
      <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-sm text-foreground">
              💬 ¿Qué está funcionando hoy?
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Comparte un tip con las demás socias
            </p>
          </div>
          {totalCount > 0 && (
            <span
              className="flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, hsl(330 85% 55%), hsl(275 65% 50%))" }}
            >
              <MessageCircle className="w-3 h-3" />
              {totalCount}
            </span>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="¿Cómo te llamas?"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Nombre de tu tienda"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="text-sm"
            />
          </div>
          <Textarea
            placeholder="¿Qué te está funcionando hoy? Comparte tu tip 💡"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="text-sm min-h-[60px]"
          />
          <Button
            variant="gradient"
            size="sm"
            className="w-full"
            onClick={handlePost}
            disabled={posting}
          >
            {posting ? "Compartiendo..." : "Compartir con las socias ✨"}
          </Button>
        </div>
      </div>

      {/* Tips list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      ) : tips.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">🌟</p>
          <p className="text-sm text-muted-foreground">
            Sé la primera en compartir un tip
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Las socias que comparten venden más.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip) => {
            const tipReplies = replies[tip.id] || [];
            const isReplying = replyingTo === tip.id;
            return (
              <div
                key={tip.id}
                className="rounded-lg border border-border p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-sm text-foreground">
                      {tip.nickname}
                    </span>
                    {tip.city && (
                      <span className="text-[10px] text-muted-foreground">
                        🏪 {tip.city}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ background: "hsl(330 85% 55%)" }}
                    >
                      Día {tip.day_number}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                    {timeAgo(tip.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {tip.message}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(tip.id, tip.likes)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      likedIds.has(tip.id)
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {tip.likes > 0 && <span>{tip.likes}</span>}
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(isReplying ? null : tip.id);
                      setReplyMessage("");
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Responder
                    {tipReplies.length > 0 && <span>({tipReplies.length})</span>}
                  </button>
                </div>

                {/* Replies */}
                {tipReplies.length > 0 && (
                  <div className="pl-3 border-l-2 border-muted space-y-2 mt-2">
                    {tipReplies.map((reply) => (
                      <div key={reply.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-display font-bold text-xs text-foreground">
                              {reply.nickname}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {timeAgo(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed pl-4">
                          {reply.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline reply form */}
                {isReplying && (
                  <div className="pl-3 border-l-2 border-primary/30 space-y-2 mt-2">
                    <Input
                      placeholder="Tu nombre"
                      value={replyNickname}
                      onChange={(e) => setReplyNickname(e.target.value)}
                      className="text-xs h-8"
                    />
                    <Textarea
                      placeholder={`Responder a ${tip.nickname}...`}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="text-xs min-h-[50px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="gradient"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handlePostReply(tip.id, tip.day_number)}
                        disabled={replyPosting}
                      >
                        {replyPosting ? "Enviando..." : "Responder"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-2 flex justify-center">
            {loadingMore && (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CommunityTips;
