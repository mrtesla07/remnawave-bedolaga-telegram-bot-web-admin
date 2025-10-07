import { memo } from "react";

// Animated gradient + brand-colored blobs for logged-in screens
export const LoggedInBackground = memo(function LoggedInBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Brand radial gradients (purple + cyan) */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_15%_-10%,rgba(110,89,245,0.22),transparent_60%),radial-gradient(900px_520px_at_85%_5%,rgba(61,201,255,0.14),transparent_60%),radial-gradient(1000px_620px_at_50%_115%,rgba(110,89,245,0.12),transparent_60%)] animate-bgFloat" />
      {/* Light-only subtle vignette for readability */}
      <div className="absolute inset-0 dark:hidden" style={{ background: "radial-gradient(1000px 650px at 50% 50%, rgb(2 6 23 / var(--vignette-alpha)), transparent 65%)" }} />

      {/* Blurred moving blobs for depth */}
      <div className="absolute -top-24 -left-24 h-[60vmin] w-[60vmin] rounded-full bg-[#6e59f5] opacity-[0.16] blur-3xl animate-blob" />
      <div className="absolute -bottom-20 -right-28 h-[55vmin] w-[55vmin] rounded-full bg-[#3dc9ff] opacity-[0.14] blur-3xl animate-blob animation-delay-2s" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[45vmin] w-[45vmin] rounded-full bg-[#7f6df7] opacity-[0.10] blur-3xl animate-blob animation-delay-4s" />

      {/* Floating particles (subtle) */}
      <div className="absolute inset-0">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className={`absolute block h-[2px] w-[2px] rounded-full bg-white/30 dark:bg-white/20 shadow-[0_0_8px_rgba(110,89,245,0.35)] animate-pulseSoft ${i % 2 === 1 ? 'hidden sm:block' : ''}`}
            style={{
              left: `${(i * 137) % 100}%`,
              top: `${(i * 83) % 100}%`,
              animationDelay: `${(i % 14) * 0.18}s`,
            }}
          />
        ))}
      </div>

      {/* Flying props: bottle and cigarette */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="bottleGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a5a1a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#274015" stopOpacity="0.95" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottle rows */}
      {Array.from({ length: 3 }).map((_, row) => (
        <div
          key={`b-${row}`}
          className="absolute -left-[12vw] top-0 h-full animate-flyHoriz"
          style={{
            animationDuration: `${28 + row * 6}s`,
            animationDelay: `${row * 4}s`,
          }}
        >
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`bottle-${row}-${idx}`}
              className="absolute"
              style={{
                top: `${10 + (idx * 20 + row * 7) % 80}%`,
                left: `${idx * 22}vw`,
              }}
            >
              <div className="relative">
                <div className="animate-drift">
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="sprite">
                    <g transform="translate(2,2)">
                      <rect x="7" y="2" width="6" height="6" rx="1" fill="#2d5016" className="sprite-body" />
                      <rect x="5" y="7" width="10" height="16" rx="2" fill="url(#bottleGlass)" className="sprite-body" />
                      <rect x="6.5" y="12" width="7" height="5" rx="1" fill="white" opacity="0.18" />
                      <rect x="7.5" y="22" width="6" height="3" rx="1" fill="#1b2a10" opacity="0.25" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Cigarette rows */}
      {Array.from({ length: 2 }).map((_, row) => (
        <div
          key={`c-${row}`}
          className="absolute -left-[12vw] top-0 h-full animate-flyHoriz"
          style={{
            animationDuration: `${24 + row * 5}s`,
            animationDelay: `${2 + row * 3}s`,
          }}
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={`cig-${row}-${idx}`}
              className="absolute"
              style={{
                top: `${(idx * 17 + row * 13) % 85}%`,
                left: `${idx * 18}vw`,
              }}
            >
              <div className="animate-drift">
                <svg width="40" height="16" viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="sprite">
                  <rect x="2" y="6" width="30" height="4" rx="2" fill="white" className="sprite-body" />
                  <rect x="32" y="6" width="6" height="4" rx="2" fill="#ff6b35" className="sprite-tip" />
                  <g opacity="0.5">
                    <circle cx="38" cy="4" r="1.2" fill="#9aa3b1" />
                    <circle cx="38" cy="3" r="0.8" fill="#b1bac7" />
                  </g>
                </svg>
              </div>
            </div>
          ))}
        </div>
      ))}
      </div>

      {/* Clickable footer credit (outside pointer-events-none) */}
      <div className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
        <a
          href="https://t.me/pedzeo"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-full px-2 py-1 text-[11px] sm:text-xs font-semibold tracking-wide"
        >
          <span className="bg-[linear-gradient(90deg,rgba(193,201,255,0.6),rgba(110,89,245,0.95),rgba(61,201,255,0.7),rgba(193,201,255,0.6))] animate-shimmer bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(110,89,245,0.3)]">
            by Pedzeo
          </span>
        </a>
      </div>
    </>
  );
});


