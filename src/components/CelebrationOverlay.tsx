import { useEffect, useState } from "react";

interface CelebrationOverlayProps {
  message: string;
  onDone: () => void;
}

const CelebrationOverlay = ({ message, onDone }: CelebrationOverlayProps) => {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([]);

  useEffect(() => {
    const colors = [
      "hsl(330 85% 55%)", "hsl(275 65% 50%)", "hsl(220 85% 55%)",
      "hsl(45 90% 55%)", "hsl(160 60% 50%)", "hsl(0 85% 60%)",
    ];
    const p = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 8,
    }));
    setParticles(p);

    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, hsl(330 85% 55% / 0.95), hsl(275 65% 50% / 0.95), hsl(220 85% 55% / 0.95))" }}
    >
      {/* Confetti */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall 2s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}

      <div className="text-center text-white px-8 animate-scale-in">
        <p className="text-5xl mb-4">🎉</p>
        <p className="font-display text-xl md:text-2xl font-bold leading-snug max-w-sm mx-auto">
          {message}
        </p>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CelebrationOverlay;
