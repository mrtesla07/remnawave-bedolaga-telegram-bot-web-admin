import type { CSSProperties } from "react";
import { useState } from "react";
import registerBg from "@/assets/register-bg.svg";
import { LoggedInBackground } from "@/components/shared/LoggedInBackground";
import { TokenDialog } from "@/components/auth/TokenDialog";

const patternSvg = encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'>
    <rect width='120' height='60' fill='rgba(20,22,34,0.55)' />
    <g opacity='0.85'>
      <rect x='6' y='6' width='18' height='40' rx='4' fill='#284116' />
      <rect x='11' y='2' width='8' height='10' rx='2' fill='#1c2c0f' />
      <rect x='13' y='16' width='10' height='12' rx='2' fill='white' opacity='0.25' />
      <rect x='48' y='22' width='42' height='10' rx='5' fill='#f9f9f9' />
      <rect x='90' y='22' width='12' height='10' rx='4' fill='#ff6b35' />
      <rect x='94' y='18' width='6' height='6' rx='3' fill='rgba(255,255,255,0.25)' />
      <rect x='26' y='8' width='10' height='30' rx='3' fill='#2d5016' opacity='0.35' />
      <rect x='68' y='6' width='12' height='32' rx='3' fill='#213c12' opacity='0.25' />
    </g>
  </svg>
`);

const textFillStyle: CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,${patternSvg}")`,
  backgroundSize: "120px 60px",
  backgroundRepeat: "repeat",
};

export function ApiOfflineScreen() {
  const [openToken, setOpenToken] = useState(false);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-slate-100">
      <LoggedInBackground />
      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[0.65rem] uppercase tracking-[0.5em] text-textMuted/80 sm:text-xs">
            no signal from bedolaga api
          </span>
          <h1
            className="text-5xl font-black uppercase leading-none drop-shadow-[0_0_40px_rgba(110,89,245,0.6)] sm:text-6xl md:text-8xl"
            style={textFillStyle}
          >
            FUCK YOU
          </h1>
        </div>
        <p className="max-w-xl text-xs text-textMuted sm:text-sm">
          API server is unreachable. Check your base URL, bearer token and connection, then refresh this page.
        </p>
        <div className="flex flex-col items-center gap-6">
          <img
            src={registerBg}
            alt="Smiling Bedolaga"
            className="w-56 max-w-full drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)] sm:w-64"
          />
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-full border border-outline/40 bg-surfaceMuted/60 px-6 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-100 transition hover:border-outline hover:bg-surface/70"
          >
            TRY AGAIN
          </button>
        
          <button
            type="button"
            onClick={() => setOpenToken(true)}
            className="inline-flex items-center rounded-full border border-outline/40 bg-surfaceMuted/60 px-6 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-100 transition hover:border-outline hover:bg-surface/70\"
          >
            SETUP API
          </button>
        </div>
      </div>
      <TokenDialog open={openToken} onClose={() => setOpenToken(false)} />
    </div>
  );
}
