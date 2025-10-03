import { memo } from "react";

// Animated gradient + brand-colored blobs for logged-in screens
export const LoggedInBackground = memo(function LoggedInBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Brand radial gradients (purple + cyan) */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_15%_-10%,rgba(110,89,245,0.22),transparent_60%),radial-gradient(900px_520px_at_85%_5%,rgba(61,201,255,0.14),transparent_60%),radial-gradient(1000px_620px_at_50%_115%,rgba(110,89,245,0.12),transparent_60%)] animate-bgFloat" />

      {/* Blurred moving blobs for depth */}
      <div className="absolute -top-24 -left-24 h-[60vmin] w-[60vmin] rounded-full bg-[#6e59f5] opacity-[0.16] blur-3xl animate-blob" />
      <div className="absolute -bottom-20 -right-28 h-[55vmin] w-[55vmin] rounded-full bg-[#3dc9ff] opacity-[0.14] blur-3xl animate-blob animation-delay-2s" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[45vmin] w-[45vmin] rounded-full bg-[#7f6df7] opacity-[0.10] blur-3xl animate-blob animation-delay-4s" />

      {/* Floating particles (subtle) */}
      <div className="absolute inset-0">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-[2px] w-[2px] rounded-full bg-white/20 shadow-[0_0_8px_rgba(110,89,245,0.35)] animate-pulseSoft"
            style={{
              left: `${(i * 137) % 100}%`,
              top: `${(i * 83) % 100}%`,
              animationDelay: `${(i % 14) * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
});


