'use client';

import React from 'react';

export function AuthIllustration() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto aspect-[4/3] flex items-center justify-center select-none">
      {/* Background ambient glow circles */}
      <div className="absolute -top-8 -left-8 w-60 h-60 bg-[#714B67]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-[#0D9488]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main SVG Composition */}
      <svg
        viewBox="0 0 540 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          <linearGradient id="mainCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F9F8FA" />
          </linearGradient>

          <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#714B67" />
            <stop offset="100%" stopColor="#55364E" />
          </linearGradient>

          <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>

          <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#714B67" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#714B67" stopOpacity="0.0" />
          </linearGradient>

          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#242126" floodOpacity="0.08" />
          </filter>

          <filter id="floatShadow" x="-15%" y="-15%" width="130%" height="135%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#242126" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Subtle grid pattern background */}
        <g opacity="0.4">
          <circle cx="40" cy="50" r="1.5" fill="#77727A" />
          <circle cx="80" cy="50" r="1.5" fill="#77727A" />
          <circle cx="120" cy="50" r="1.5" fill="#77727A" />
          <circle cx="40" cy="90" r="1.5" fill="#77727A" />
          <circle cx="80" cy="90" r="1.5" fill="#77727A" />
          <circle cx="120" cy="90" r="1.5" fill="#77727A" />
          <circle cx="440" cy="280" r="1.5" fill="#77727A" />
          <circle cx="480" cy="280" r="1.5" fill="#77727A" />
          <circle cx="440" cy="320" r="1.5" fill="#77727A" />
          <circle cx="480" cy="320" r="1.5" fill="#77727A" />
        </g>

        {/* 1. Main Application Dashboard Mockup Card */}
        <g filter="url(#cardShadow)">
          <rect
            x="60"
            y="45"
            width="380"
            height="270"
            rx="18"
            fill="url(#mainCardGrad)"
            stroke="#E8E5E9"
            strokeWidth="1.5"
          />

          {/* Browser / App Header bar */}
          <rect x="60" y="45" width="380" height="34" rx="18" fill="#F4F1F5" />
          <path d="M60 62 H440 V79 H60 Z" fill="#F4F1F5" />
          <line x1="60" y1="79" x2="440" y2="79" stroke="#E8E5E9" strokeWidth="1" />

          {/* Window control dots */}
          <circle cx="82" cy="62" r="4.5" fill="#FDA4AF" />
          <circle cx="96" cy="62" r="4.5" fill="#FDE047" />
          <circle cx="110" cy="62" r="4.5" fill="#86EFAC" />

          {/* App title placeholder */}
          <rect x="190" y="56" width="120" height="12" rx="6" fill="#E8E5E9" />

          {/* Sidebar inside mock */}
          <rect x="74" y="92" width="68" height="205" rx="10" fill="#FFFFFF" stroke="#E8E5E9" strokeWidth="1" />
          <rect x="84" y="106" width="48" height="8" rx="4" fill="#714B67" opacity="0.8" />
          <rect x="84" y="124" width="40" height="6" rx="3" fill="#D4D0D6" />
          <rect x="84" y="138" width="44" height="6" rx="3" fill="#D4D0D6" />
          <rect x="84" y="152" width="36" height="6" rx="3" fill="#D4D0D6" />
          <rect x="84" y="166" width="42" height="6" rx="3" fill="#D4D0D6" />

          {/* KPI Mini-cards in mock */}
          <rect x="154" y="92" width="130" height="52" rx="10" fill="#FFFFFF" stroke="#E8E5E9" strokeWidth="1" />
          <rect x="166" y="102" width="55" height="6" rx="3" fill="#77727A" opacity="0.6" />
          <text x="166" y="126" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#242126">
            ₹1,24,500
          </text>
          <circle cx="266" cy="116" r="10" fill="#F3EEF2" />
          <path d="M263 118 L266 114 L269 118" stroke="#714B67" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="294" y="92" width="132" height="52" rx="10" fill="#FFFFFF" stroke="#E8E5E9" strokeWidth="1" />
          <rect x="306" y="102" width="58" height="6" rx="3" fill="#77727A" opacity="0.6" />
          <text x="306" y="126" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#0F766E">
            342 Active
          </text>
          <circle cx="408" cy="116" r="10" fill="#CCFBF1" />
          <path d="M404 116 L407 119 L412 113" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Chart Section in mock */}
          <rect x="154" y="154" width="272" height="143" rx="10" fill="#FFFFFF" stroke="#E8E5E9" strokeWidth="1" />
          <rect x="166" y="166" width="80" height="7" rx="3.5" fill="#242126" opacity="0.8" />
          <rect x="166" y="177" width="48" height="5" rx="2.5" fill="#77727A" opacity="0.5" />

          {/* Grid lines inside chart */}
          <line x1="166" y1="210" x2="410" y2="210" stroke="#F0EDF2" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="166" y1="240" x2="410" y2="240" stroke="#F0EDF2" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="166" y1="270" x2="410" y2="270" stroke="#E8E5E9" strokeWidth="1" />

          {/* Area fill under curve */}
          <path
            d="M 170 265 Q 210 240, 240 230 T 310 205 T 370 195 T 405 185 L 405 270 L 170 270 Z"
            fill="url(#chartAreaGrad)"
          />

          {/* Revenue growth trend line */}
          <path
            d="M 170 265 Q 210 240, 240 230 T 310 205 T 370 195 T 405 185"
            fill="none"
            stroke="url(#primaryGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Data point pulses */}
          <circle cx="310" cy="205" r="4" fill="#FFFFFF" stroke="#714B67" strokeWidth="2.5" />
          <circle cx="405" cy="185" r="4.5" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
        </g>

        {/* 2. Floating Pill 1: Invoice Settled badge (Top Right) */}
        <g filter="url(#floatShadow)">
          <rect x="340" y="20" width="170" height="54" rx="14" fill="#FFFFFF" stroke="#E8E5E9" strokeWidth="1.2" />
          <circle cx="365" cy="47" r="13" fill="#D1FAE5" />
          <path d="M360 47 L364 50 L370 44" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="386" y="42" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#242126">
            Invoice Settled
          </text>
          <text x="386" y="56" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#059669">
            ₹18,450 • Tax Paid
          </text>
        </g>

        {/* 3. Floating Pill 2: Subscription Renewed (Bottom Left) */}
        <g filter="url(#floatShadow)">
          <rect x="25" y="240" width="175" height="56" rx="14" fill="#FFFFFF" stroke="#E8E5E9" strokeWidth="1.2" />
          <rect x="37" y="252" width="30" height="30" rx="8" fill="#F4ECF3" />
          <path
            d="M48 262 A 5 5 0 1 1 54 267 M54 262 L54 267 L49 267"
            stroke="#714B67"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="75" y="266" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#242126">
            Auto-Renew Active
          </text>
          <text x="75" y="279" fontFamily="sans-serif" fontSize="10" fill="#77727A">
            Enterprise Annual Plan
          </text>
        </g>

        {/* 4. Floating Pill 3: MRR Growth Indicator (Bottom Right) */}
        <g filter="url(#floatShadow)">
          <rect x="360" y="295" width="155" height="52" rx="14" fill="#FFFFFF" stroke="#E8E5E9" strokeWidth="1.2" />
          <circle cx="384" cy="321" r="12" fill="#CCFBF1" />
          <path d="M380 324 L384 317 L388 321 L391 316" stroke="#0F766E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <text x="404" y="316" fontFamily="sans-serif" fontSize="10" fill="#77727A">
            MRR Momentum
          </text>
          <text x="404" y="330" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#0F766E">
            +24.8% Growth
          </text>
        </g>

        {/* 5. Minimalist Team Avatars collaborating */}
        <g>
          {/* Avatar 1 */}
          <circle cx="170" cy="355" r="16" fill="#714B67" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="170" cy="350" r="5.5" fill="#F4ECF3" />
          <path d="M161 366 C161 360 165 357 170 357 C175 357 179 360 179 366 Z" fill="#F4ECF3" />

          {/* Avatar 2 */}
          <circle cx="196" cy="355" r="16" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="196" cy="350" r="5.5" fill="#CCFBF1" />
          <path d="M187 366 C187 360 191 357 196 357 C201 357 205 360 205 366 Z" fill="#CCFBF1" />

          {/* Avatar 3 */}
          <circle cx="222" cy="355" r="16" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="222" cy="350" r="5.5" fill="#FEF3C7" />
          <path d="M213 366 C213 360 217 357 222 357 C227 357 231 360 231 366 Z" fill="#FEF3C7" />

          {/* Caption */}
          <text x="248" y="358" fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="#242126">
            10,000+ businesses powered
          </text>
          <text x="248" y="370" fontFamily="sans-serif" fontSize="9.5" fill="#77727A">
            Admin • Staff • Verified Subscribers
          </text>
        </g>
      </svg>
    </div>
  );
}
