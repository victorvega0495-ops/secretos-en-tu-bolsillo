import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const storeElements = [
  {
    id: "letrero",
    name: "Letrero de la tienda",
    wa: "WhatsApp Business: tu nombre, descripción y horario profesional",
    number: 1,
  },
  {
    id: "aparador",
    name: "Aparador con zapatos",
    wa: "Estados de WhatsApp: tu vitrina que trabaja mientras duermes",
    number: 2,
  },
  {
    id: "racks",
    name: "Racks con mercancía",
    wa: "Tu catálogo personal: tus 20-30 productos favoritos",
    number: 3,
  },
  {
    id: "tablet",
    name: "Tablet / Catálogo digital",
    wa: "Catálogo Interactivo Price Shoes: tu tienda completa con pedido integrado",
    number: 4,
  },
  {
    id: "lupita",
    name: "Lupita atendiendo",
    wa: "Tu mensaje de ventas: la vendedora que nunca descansa",
    number: 5,
  },
  {
    id: "libreta",
    name: "Libreta en el mostrador",
    wa: "Tus etiquetas: la base de clientas que regresan solas",
    number: 6,
  },
  {
    id: "consultora",
    name: "Consultora de imagen",
    wa: "IA Personal Shopper: próximamente en la siguiente sesión",
    number: 7,
  },
];

const StoreSection = () => {
  const [active, setActive] = useState<number | null>(null);

  const handleClick = (index: number) => {
    setActive(active === index ? null : index);
  };

  return (
    <section id="tienda-section" className="py-20 bg-muted/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-3">
          La Tienda de <span className="gradient-text">Lupita</span>
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          Haz click en cada elemento para descubrir su equivalente en WhatsApp
        </p>

        {/* Tooltip overlay */}
        {active !== null && (
          <div className="mb-6 mx-auto max-w-md animate-fade-in-up">
            <div className="relative bg-card border-2 border-primary rounded-2xl p-5 shadow-xl">
              <button
                onClick={() => setActive(null)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {storeElements[active].number}
                </span>
                <div>
                  <p className="font-display font-bold text-sm mb-1">{storeElements[active].name}</p>
                  <p className="text-xs font-medium text-primary mb-1">En WhatsApp:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{storeElements[active].wa}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Store Illustration */}
        <div className="relative w-full mx-auto" style={{ maxWidth: 900 }}>
          <svg
            viewBox="0 0 900 520"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Ilustración de la tienda de Lupita con elementos interactivos"
          >
            <defs>
              <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF0F5" />
                <stop offset="100%" stopColor="#FCE4EC" />
              </linearGradient>
              <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D7CCC8" />
                <stop offset="100%" stopColor="#BCAAA4" />
              </linearGradient>
              <linearGradient id="ceilingGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F8BBD0" />
                <stop offset="100%" stopColor="#E1BEE7" />
              </linearGradient>
              <linearGradient id="awningGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EC407A" />
                <stop offset="100%" stopColor="#AD1457" />
              </linearGradient>
              <linearGradient id="counterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8D6E63" />
                <stop offset="100%" stopColor="#6D4C41" />
              </linearGradient>
              <linearGradient id="shelfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A1887F" />
                <stop offset="100%" stopColor="#8D6E63" />
              </linearGradient>
              <linearGradient id="goldAccent" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFD54F" />
                <stop offset="100%" stopColor="#FFB300" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="shadow">
                <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* === BUILDING STRUCTURE === */}
            {/* Back wall */}
            <rect x="40" y="80" width="820" height="360" rx="4" fill="url(#wallGrad)" stroke="#E8B4B8" strokeWidth="2" />

            {/* Floor */}
            <rect x="40" y="420" width="820" height="60" rx="0" fill="url(#floorGrad)" />
            {/* Floor tiles */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <line key={`ft-${i}`} x1={40 + i * 82} y1="420" x2={40 + i * 82} y2="480" stroke="#C8B6A6" strokeWidth="0.5" opacity="0.5" />
            ))}

            {/* Ceiling/Roof */}
            <rect x="30" y="65" width="840" height="25" rx="4" fill="url(#ceilingGrad)" filter="url(#shadow)" />

            {/* Awning */}
            <path d="M30,65 L30,45 Q450,20 870,45 L870,65 Z" fill="url(#awningGrad)" filter="url(#shadow)" />
            {/* Awning stripes */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <path key={`aw-${i}`} d={`M${95 + i * 105},47 L${95 + i * 105},65`} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
            ))}

            {/* Entrance opening */}
            <rect x="350" y="280" width="200" height="160" rx="3" fill="#5D4037" opacity="0.15" />
            <rect x="355" y="285" width="190" height="155" rx="2" fill="#EFEBE9" opacity="0.4" />

            {/* === 1. LETRERO (Sign) === */}
            <g
              className="cursor-pointer transition-all duration-300"
              onClick={() => handleClick(0)}
              role="button"
              tabIndex={0}
              aria-label="Letrero de la tienda"
            >
              <rect
                x="250" y="18" width="400" height="38" rx="8"
                fill="url(#goldAccent)"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-300",
                  active === 0 ? "stroke-[#EC407A] stroke-[3]" : "stroke-[#FFB300] stroke-[1]"
                )}
                style={active === 0 ? { filter: "url(#glow)" } : {}}
              />
              <text x="450" y="43" textAnchor="middle" fontFamily="serif" fontWeight="bold" fontSize="18" fill="#5D4037">
                La Tienda de Lupita
              </text>
              {/* Number badge */}
              <circle cx="660" cy="37" r="12" fill="#EC407A" />
              <text x="660" y="42" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">1</text>
            </g>

            {/* === 2. APARADOR / VITRINA (Display Window) === */}
            <g
              className="cursor-pointer transition-all duration-300"
              onClick={() => handleClick(1)}
              role="button"
              tabIndex={0}
              aria-label="Aparador con zapatos"
            >
              {/* Window frame */}
              <rect
                x="60" y="100" width="250" height="170" rx="6"
                fill="#FFFFFF" fillOpacity="0.9"
                className={cn(
                  "transition-all duration-300",
                  active === 1 ? "stroke-[#EC407A] stroke-[3]" : "stroke-[#E8B4B8] stroke-[2]"
                )}
                style={active === 1 ? { filter: "url(#glow)" } : {}}
              />
              {/* Glass reflection */}
              <rect x="65" y="105" width="60" height="160" rx="2" fill="#E3F2FD" opacity="0.3" />

              {/* Display shelf */}
              <rect x="70" y="200" width="230" height="4" rx="2" fill="#BCAAA4" />

              {/* Shoes on display */}
              {/* Heel 1 */}
              <g transform="translate(100, 170)">
                <path d="M0,25 Q5,0 15,5 L30,20 L35,25 L0,25 Z" fill="#EC407A" />
                <path d="M15,5 L18,0 L20,5" stroke="#AD1457" strokeWidth="1.5" fill="none" />
              </g>
              {/* Heel 2 */}
              <g transform="translate(160, 175)">
                <path d="M0,20 Q5,0 12,3 L25,15 L28,20 L0,20 Z" fill="#CE93D8" />
                <path d="M12,3 L14,-2 L16,3" stroke="#7B1FA2" strokeWidth="1.5" fill="none" />
              </g>
              {/* Sandal */}
              <g transform="translate(220, 178)">
                <ellipse cx="15" cy="17" rx="18" ry="6" fill="#FFB74D" />
                <path d="M5,15 Q15,5 25,15" stroke="#E65100" strokeWidth="1.5" fill="none" />
              </g>
              {/* Bag on display */}
              <g transform="translate(110, 120)">
                <rect x="0" y="10" width="30" height="25" rx="5" fill="#F48FB1" />
                <path d="M5,10 Q15,-5 25,10" stroke="#AD1457" strokeWidth="2" fill="none" />
                <circle cx="15" cy="22" r="3" fill="#FFD54F" />
              </g>
              {/* Another bag */}
              <g transform="translate(200, 115)">
                <rect x="0" y="10" width="35" height="28" rx="4" fill="#B39DDB" />
                <path d="M7,10 Q17,-5 28,10" stroke="#4A148C" strokeWidth="2" fill="none" />
                <rect x="12" y="18" width="10" height="6" rx="1" fill="#FFD54F" />
              </g>

              {/* "NUEVO" tag */}
              <rect x="65" y="100" width="45" height="18" rx="3" fill="#FF5252" />
              <text x="87" y="113" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">NUEVO</text>

              {/* Number badge */}
              <circle cx="300" cy="110" r="12" fill="#EC407A" />
              <text x="300" y="115" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">2</text>
            </g>

            {/* === 3. RACKS / ESTANTES (Shelves with merchandise) === */}
            <g
              className="cursor-pointer transition-all duration-300"
              onClick={() => handleClick(2)}
              role="button"
              tabIndex={0}
              aria-label="Racks con mercancía"
            >
              {/* Shelf unit */}
              <rect
                x="590" y="100" width="250" height="210" rx="4"
                fill="#EFEBE9"
                className={cn(
                  "transition-all duration-300",
                  active === 2 ? "stroke-[#EC407A] stroke-[3]" : "stroke-[#D7CCC8] stroke-[2]"
                )}
                style={active === 2 ? { filter: "url(#glow)" } : {}}
              />
              {/* Shelves */}
              {[0, 1, 2, 3].map(i => (
                <rect key={`sh-${i}`} x="595" y={145 + i * 45} width="240" height="5" rx="1" fill="url(#shelfGrad)" />
              ))}
              {/* Products on shelves — boxes */}
              {[0, 1, 2].map(row => (
                [0, 1, 2, 3, 4].map(col => {
                  const colors = ["#F48FB1", "#CE93D8", "#90CAF9", "#FFB74D", "#A5D6A7", "#EF9A9A", "#80CBC4"];
                  const c = colors[(row * 5 + col) % colors.length];
                  return (
                    <rect
                      key={`box-${row}-${col}`}
                      x={605 + col * 47}
                      y={110 + row * 45}
                      width="35"
                      height="30"
                      rx="3"
                      fill={c}
                      opacity="0.85"
                    />
                  );
                })
              ))}
              {/* Shoe boxes on bottom shelf */}
              {[0, 1, 2, 3].map(col => (
                <g key={`sbox-${col}`} transform={`translate(${608 + col * 58}, 255)`}>
                  <rect x="0" y="0" width="42" height="22" rx="2" fill="#FF8A65" opacity="0.8" />
                  <line x1="0" y1="11" x2="42" y2="11" stroke="white" strokeWidth="0.5" opacity="0.5" />
                </g>
              ))}
              {/* Number badge */}
              <circle cx="830" cy="110" r="12" fill="#EC407A" />
              <text x="830" y="115" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">3</text>
            </g>

            {/* === COUNTER (Mostrador) === */}
            <rect x="100" y="340" width="350" height="80" rx="6" fill="url(#counterGrad)" filter="url(#shadow)" />
            <rect x="105" y="340" width="340" height="8" rx="2" fill="#A1887F" />

            {/* === 4. TABLET on counter === */}
            <g
              className="cursor-pointer transition-all duration-300"
              onClick={() => handleClick(3)}
              role="button"
              tabIndex={0}
              aria-label="Tablet / Catálogo digital"
            >
              {/* Tablet body */}
              <rect
                x="150" y="310" width="65" height="40" rx="5"
                fill="#37474F"
                className={cn(
                  "transition-all duration-300",
                  active === 3 ? "stroke-[#EC407A] stroke-[3]" : "stroke-[#263238] stroke-[1]"
                )}
                style={active === 3 ? { filter: "url(#glow)" } : {}}
              />
              {/* Screen */}
              <rect x="155" y="314" width="55" height="28" rx="2" fill="#E3F2FD" />
              {/* Screen content lines */}
              <rect x="160" y="319" width="30" height="3" rx="1" fill="#90CAF9" />
              <rect x="160" y="325" width="40" height="3" rx="1" fill="#CE93D8" />
              <rect x="160" y="331" width="25" height="3" rx="1" fill="#F48FB1" />
              {/* Stand */}
              <rect x="178" y="348" width="10" height="5" rx="1" fill="#455A64" />
              {/* Number badge */}
              <circle cx="222" cy="312" r="12" fill="#EC407A" />
              <text x="222" y="317" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">4</text>
            </g>

            {/* === 6. LIBRETA on counter === */}
            <g
              className="cursor-pointer transition-all duration-300"
              onClick={() => handleClick(5)}
              role="button"
              tabIndex={0}
              aria-label="Libreta en el mostrador"
            >
              <g transform="rotate(-8, 360, 330)">
                <rect
                  x="330" y="312" width="50" height="38" rx="3"
                  fill="#FFF9C4"
                  className={cn(
                    "transition-all duration-300",
                    active === 5 ? "stroke-[#EC407A] stroke-[3]" : "stroke-[#F9A825] stroke-[1]"
                  )}
                  style={active === 5 ? { filter: "url(#glow)" } : {}}
                />
                {/* Lines on notebook */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={`nl-${i}`} x1="335" y1={321 + i * 6} x2="375" y2={321 + i * 6} stroke="#E0E0E0" strokeWidth="0.5" />
                ))}
                {/* Pen */}
                <line x1="378" y1="310" x2="388" y2="350" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="378" cy="310" r="2" fill="#1565C0" />
              </g>
              {/* Number badge */}
              <circle cx="395" cy="312" r="12" fill="#EC407A" />
              <text x="395" y="317" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">6</text>
            </g>

            {/* === 5. LUPITA attending a client === */}
            <g
              className="cursor-pointer transition-all duration-300"
              onClick={() => handleClick(4)}
              role="button"
              tabIndex={0}
              aria-label="Lupita atendiendo a una clienta"
            >
              {/* Lupita */}
              <g
                className={cn("transition-all duration-300")}
                style={active === 4 ? { filter: "url(#glow)" } : {}}
              >
                {/* Body */}
                <ellipse cx="490" cy="395" rx="22" ry="35" fill="#EC407A" />
                {/* Head */}
                <circle cx="490" cy="345" r="18" fill="#FFCC80" />
                {/* Hair */}
                <path d="M472,340 Q475,320 490,318 Q505,320 508,340" fill="#5D4037" />
                <ellipse cx="490" cy="332" rx="20" ry="12" fill="#5D4037" />
                {/* Face */}
                <circle cx="484" cy="347" r="2" fill="#5D4037" />
                <circle cx="496" cy="347" r="2" fill="#5D4037" />
                <path d="M486,354 Q490,358 494,354" stroke="#E91E63" strokeWidth="1.5" fill="none" />
                {/* Arms */}
                <line x1="470" y1="370" x2="455" y2="390" stroke="#FFCC80" strokeWidth="5" strokeLinecap="round" />
                <line x1="510" y1="370" x2="530" y2="385" stroke="#FFCC80" strokeWidth="5" strokeLinecap="round" />
                {/* Apron */}
                <rect x="478" y="375" width="24" height="20" rx="3" fill="white" opacity="0.7" />
              </g>

              {/* Client figure */}
              <g>
                {/* Body */}
                <ellipse cx="555" cy="398" rx="18" ry="30" fill="#7E57C2" />
                {/* Head */}
                <circle cx="555" cy="352" r="15" fill="#FFCC80" />
                {/* Hair */}
                <path d="M540,348 Q543,330 555,328 Q567,330 570,348" fill="#3E2723" />
                <ellipse cx="555" cy="340" rx="17" ry="10" fill="#3E2723" />
                {/* Shopping bag in hand */}
                <g transform="translate(530, 392)">
                  <rect x="0" y="0" width="16" height="18" rx="2" fill="#F48FB1" />
                  <path d="M3,0 Q8,-8 13,0" stroke="#AD1457" strokeWidth="1.5" fill="none" />
                </g>
              </g>

              {/* Number badge */}
              <circle cx="520" cy="335" r="12" fill="#EC407A" />
              <text x="520" y="340" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">5</text>
            </g>

            {/* === 7. CONSULTORA DE IMAGEN (at the back) === */}
            <g
              className="cursor-pointer transition-all duration-300"
              onClick={() => handleClick(6)}
              role="button"
              tabIndex={0}
              aria-label="Consultora de imagen"
            >
              <g
                className={cn("transition-all duration-300")}
                style={active === 6 ? { filter: "url(#glow)" } : {}}
              >
                {/* Full-length mirror */}
                <rect x="680" y="320" width="55" height="95" rx="25" fill="#E3F2FD" stroke="#B0BEC5" strokeWidth="2" />
                <rect x="685" y="325" width="45" height="85" rx="20" fill="white" opacity="0.5" />

                {/* Consultora figure */}
                {/* Body */}
                <ellipse cx="650" cy="390" rx="17" ry="28" fill="#AB47BC" />
                {/* Head */}
                <circle cx="650" cy="348" r="14" fill="#FFCC80" />
                {/* Hair - long */}
                <path d="M636,345 Q638,328 650,326 Q662,328 664,345" fill="#F9A825" />
                <ellipse cx="650" cy="337" rx="16" ry="10" fill="#F9A825" />
                <path d="M636,345 L633,370" stroke="#F9A825" strokeWidth="3" strokeLinecap="round" />
                <path d="M664,345 L667,370" stroke="#F9A825" strokeWidth="3" strokeLinecap="round" />
                {/* Sparkles ✨ */}
                <text x="670" y="330" fontSize="14">✨</text>
                <text x="630" y="345" fontSize="10">✨</text>
                {/* Clipboard */}
                <rect x="625" y="378" width="14" height="18" rx="2" fill="#FFF9C4" stroke="#F9A825" strokeWidth="1" />
              </g>
              {/* Number badge */}
              <circle cx="740" cy="325" r="12" fill="#EC407A" />
              <text x="740" y="330" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">7</text>
            </g>

            {/* === DECORATIVE ELEMENTS === */}
            {/* Hanging lights */}
            {[150, 350, 550, 750].map((cx, i) => (
              <g key={`light-${i}`}>
                <line x1={cx} y1="90" x2={cx} y2="105" stroke="#E0E0E0" strokeWidth="1" />
                <circle cx={cx} cy="110" r="6" fill="#FFF9C4" opacity="0.8" />
                <circle cx={cx} cy="110" r="3" fill="#FFD54F" />
              </g>
            ))}

            {/* Plant pot near entrance */}
            <g transform="translate(330, 400)">
              <rect x="0" y="10" width="20" height="18" rx="3" fill="#8D6E63" />
              <ellipse cx="10" cy="8" rx="14" ry="10" fill="#66BB6A" />
              <ellipse cx="6" cy="2" rx="8" ry="7" fill="#81C784" />
            </g>

            {/* Welcome mat */}
            <rect x="385" y="435" width="130" height="18" rx="3" fill="#F48FB1" opacity="0.5" />
            <text x="450" y="448" textAnchor="middle" fontSize="8" fill="#AD1457" fontWeight="bold">BIENVENIDA ♡</text>

          </svg>
        </div>

        {/* Mobile legend */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:hidden">
          {storeElements.map((el, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl text-left transition-all border",
                active === i
                  ? "bg-card border-primary shadow-md"
                  : "bg-card/50 border-transparent"
              )}
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {el.number}
              </span>
              <span className="text-xs font-medium">{el.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoreSection;
