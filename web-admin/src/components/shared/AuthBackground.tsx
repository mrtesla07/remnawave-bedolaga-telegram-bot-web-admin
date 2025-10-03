import { memo } from "react";

export const AuthBackground = memo(function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-100">
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="max-w-[900px] w-[90%] h-auto drop-shadow-xl">
        <defs>
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#667eea", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "#764ba2", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#f093fb", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#d4a574", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#b8935f", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="redSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#e8b598", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#d4a574", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="clothesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#3a3a3a", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#595959", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="bottleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#2d5016", stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: "#1a2f0d", stopOpacity: 0.9 }} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="2" dy="4" result="offset" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* remove solid background rect to improve contrast over page bg */}

        <circle cx="50" cy="80" r="30" fill="url(#mainGradient)" opacity="0.1" />
        <circle cx="350" cy="120" r="40" fill="#8B4513" opacity="0.1" />

        <g transform="translate(200,200)" opacity="0.2">
          <path d="M-120,-100 Q-60,-130 0,-100 Q60,-70 120,-100" stroke="url(#mainGradient)" strokeWidth="4" fill="none">
            <animate attributeName="d" values="M-120,-100 Q-60,-130 0,-100 Q60,-70 120,-100;M-120,-100 Q-60,-70 0,-100 Q60,-130 120,-100;M-120,-100 Q-60,-130 0,-100 Q60,-70 120,-100" dur="4s" repeatCount="indefinite" />
          </path>
        </g>

        <g transform="translate(200,180)" filter="url(#dropshadow)">
          <ellipse cx="0" cy="30" rx="45" ry="60" fill="url(#clothesGradient)" />
          <path d="M-45,70 L-40,75 L-35,70 L-30,75 L-25,70 L-20,75 L-15,70 L-10,75 L-5,70 L0,75 L5,70 L10,75 L15,70 L20,75 L25,70 L30,75 L35,70 L40,75 L45,70" stroke="none" fill="#2a2a2a" />
          <rect x="-20" y="10" width="12" height="10" fill="#5a4a3a" opacity="0.7" rx="2" />
          <rect x="15" y="35" width="10" height="8" fill="#4a4a4a" opacity="0.8" rx="1" />
          <rect x="-10" y="45" width="8" height="12" fill="#6a5a4a" opacity="0.6" rx="1" />
          <rect x="-12" y="-25" width="24" height="20" fill="url(#redSkinGradient)" rx="8" />
          <ellipse cx="0" cy="-45" rx="28" ry="32" fill="url(#redSkinGradient)" />
          <path d="M-25,-70 Q-20,-75 -15,-72 Q-10,-78 -5,-73 Q0,-80 5,-73 Q10,-78 15,-72 Q20,-75 25,-70" stroke="#3a3a3a" strokeWidth="4" fill="#3a3a3a" strokeLinecap="round" />
          <path d="M-28,-65 Q-25,-70 -20,-67" stroke="#3a3a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M28,-65 Q25,-70 20,-67" stroke="#3a3a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="-28" cy="-45" rx="6" ry="10" fill="url(#skinGradient)" />
          <ellipse cx="28" cy="-45" rx="6" ry="10" fill="url(#skinGradient)" />
          <ellipse cx="-10" cy="-50" rx="8" ry="5" fill="white" />
          <ellipse cx="10" cy="-50" rx="8" ry="5" fill="white" />
          <g id="eyes">
            <circle cx="-8" cy="-49" r="3" fill="#333">
              <animate attributeName="cx" values="-8;-10;-8" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="12" cy="-49" r="3" fill="#333">
              <animate attributeName="cx" values="12;10;12" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
          <path d="M-18,-50 L-15,-51" stroke="red" strokeWidth="1" opacity="0.7" />
          <path d="M-17,-48 L-14,-49" stroke="red" strokeWidth="0.5" opacity="0.7" />
          <path d="M18,-50 L15,-51" stroke="red" strokeWidth="1" opacity="0.7" />
          <path d="M17,-48 L14,-49" stroke="red" strokeWidth="0.5" opacity="0.7" />
          <ellipse cx="-10" cy="-44" rx="8" ry="3" fill="#8a6a4a" opacity="0.5" />
          <ellipse cx="10" cy="-44" rx="8" ry="3" fill="#8a6a4a" opacity="0.5" />
          <ellipse cx="0" cy="-38" rx="6" ry="5" fill="#d67070" />
          <circle cx="-2" cy="-39" r="1" fill="#e08080" opacity="0.8" />
          <g opacity="0.6">
            <circle cx="-15" cy="-30" r="1" fill="#555" />
            <circle cx="-12" cy="-28" r="0.8" fill="#555" />
            <circle cx="-8" cy="-30" r="0.8" fill="#555" />
            <circle cx="15" cy="-30" r="1" fill="#555" />
            <circle cx="12" cy="-28" r="0.8" fill="#555" />
            <circle cx="8" cy="-30" r="0.8" fill="#555" />
            <circle cx="0" cy="-28" r="0.8" fill="#555" />
            <circle cx="-5" cy="-26" r="0.8" fill="#555" />
            <circle cx="5" cy="-26" r="0.8" fill="#555" />
          </g>
          <g id="mouth-group">
            <path d="M-12,-20 Q0,-18 12,-20" stroke="#444" strokeWidth="2" fill="none" strokeLinecap="round" />
            <g id="cigarette">
              <rect x="10" y="-22" width="25" height="3" fill="white" rx="1">
                <animate attributeName="opacity" values="0;0;0;1;1;1;0;0;0" dur="8s" repeatCount="indefinite" />
              </rect>
              <rect x="30" y="-22" width="5" height="3" fill="#ff6b35">
                <animate attributeName="opacity" values="0;0;0;1;1;1;0;0;0" dur="8s" repeatCount="indefinite" />
              </rect>
              <g opacity="0.4">
                <circle cx="35" cy="-22" r="2" fill="#999">
                  <animate attributeName="opacity" values="0;0;0;0.6;0.3;0;0;0;0" dur="8s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="-22;-22;-22;-28;-35;-40;-22;-22;-22" dur="8s" repeatCount="indefinite" />
                  <animate attributeName="r" values="2;2;2;4;6;8;2;2;2" dur="8s" repeatCount="indefinite" />
                </circle>
              </g>
            </g>
          </g>
          <g id="left-arm">
            <line x1="-45" y1="10" x2="-55" y2="-5" stroke="url(#skinGradient)" strokeWidth="8" strokeLinecap="round">
              <animate attributeName="x2" values="-55;-50;-55" dur="8s" repeatCount="indefinite" />
              <animate attributeName="y2" values="-5;-20;-5" dur="8s" repeatCount="indefinite" />
            </line>
            <circle cx="-55" cy="-5" r="6" fill="url(#skinGradient)">
              <animate attributeName="cx" values="-55;-50;-55" dur="8s" repeatCount="indefinite" />
              <animate attributeName="cy" values="-5;-20;-5" dur="8s" repeatCount="indefinite" />
            </circle>
            <g id="bottle">
              <rect x="-62" y="-25" width="14" height="30" fill="url(#bottleGradient)" rx="2">
                <animate attributeName="x" values="-62;-57;-62" dur="8s" repeatCount="indefinite" />
                <animate attributeName="y" values="-25;-40;-25" dur="8s" repeatCount="indefinite" />
                <animate attributeName="transform" values="rotate(0 -55 -10);rotate(-30 -50 -25);rotate(0 -55 -10)" dur="8s" repeatCount="indefinite" />
              </rect>
              <rect x="-58" y="-30" width="6" height="8" fill="#2d5016">
                <animate attributeName="x" values="-58;-53;-58" dur="8s" repeatCount="indefinite" />
                <animate attributeName="y" values="-30;-45;-30" dur="8s" repeatCount="indefinite" />
              </rect>
              <rect x="-60" y="-15" width="10" height="8" fill="white" opacity="0.3">
                <animate attributeName="x" values="-60;-55;-60" dur="8s" repeatCount="indefinite" />
                <animate attributeName="y" values="-15;-30;-15" dur="8s" repeatCount="indefinite" />
              </rect>
            </g>
          </g>
          <g id="right-arm">
            <line x1="45" y1="10" x2="55" y2="20" stroke="url(#skinGradient)" strokeWidth="8" strokeLinecap="round">
              <animate attributeName="x2" values="55;57;55;53;55" dur="2s" repeatCount="indefinite" />
            </line>
            <circle cx="55" cy="20" r="6" fill="url(#skinGradient)">
              <animate attributeName="cx" values="55;57;55;53;55" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
          <rect x="-15" y="85" width="12" height="35" fill="#4a4a5a" rx="2" />
          <rect x="3" y="85" width="12" height="35" fill="#4a4a5a" rx="2" />
          <ellipse cx="-9" cy="95" rx="3" ry="4" fill="#1a1a2e" />
          <ellipse cx="9" cy="105" rx="2" ry="3" fill="#1a1a2e" />
          <ellipse cx="-9" cy="125" rx="10" ry="6" fill="#2a2a2a" />
          <ellipse cx="9" cy="125" rx="10" ry="6" fill="#2a2a2a" />
          <circle cx="-6" cy="123" r="2" fill="#1a1a2e" />
          <circle cx="12" cy="123" r="1.5" fill="#1a1a2e" />
          <circle cx="0" cy="25" r="20" fill="url(#mainGradient)" opacity="0.8" stroke="white" strokeWidth="1" />
          <text x="0" y="35" fontFamily="Arial Black, sans-serif" fontSize="28" fontWeight="bold" textAnchor="middle" fill="white">B</text>
        </g>

        <g opacity="0.6">
          <rect x="80" y="340" width="8" height="20" fill="#2d5016" rx="1" transform="rotate(75 84 350)" />
          <rect x="310" y="330" width="7" height="18" fill="#3a5a1a" rx="1" transform="rotate(-60 313 339)" />
          <rect x="150" y="350" width="6" height="16" fill="#2d5016" rx="1" transform="rotate(45 153 358)" />
        </g>
        <g opacity="0.7">
          <rect x="120" y="360" width="12" height="2" fill="white" rx="1" />
          <rect x="130" y="360" width="2" height="2" fill="#ff6b35" />
          <rect x="250" y="355" width="10" height="2" fill="white" rx="1" transform="rotate(30 255 356)" />
          <rect x="258" y="355" width="2" height="2" fill="#ff6b35" transform="rotate(30 259 356)" />
        </g>
        <text x="200" y="320" fontFamily="Arial Black, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="url(#mainGradient)" filter="url(#glow)">Remnawave</text>
        <text x="200" y="345" fontFamily="Arial Black, sans-serif" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#d67070">Bedolaga Bot</text>
        <text x="200" y="365" fontFamily="Arial, sans-serif" fontSize="11" textAnchor="middle" fill="#8892b0" opacity="0.8">Telegram VPN Manager</text>
        <g opacity="0.5">
          <circle cx="150" cy="150" r="1" fill="#333">
            <animateTransform attributeName="transform" type="rotate" values="0 200 180;360 200 180" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="250" cy="150" r="1" fill="#333">
            <animateTransform attributeName="transform" type="rotate" values="360 200 180;0 200 180" dur="5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
});


