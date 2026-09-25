import React from 'react';

interface BrandAppIconProps {
  appId: string;
  className?: string;
  size?: number;
}

export const BrandAppIcon: React.FC<BrandAppIconProps> = ({ appId, className = 'w-7 h-7', size }) => {
  const normalized = appId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const style = size ? { width: size, height: size } : undefined;

  // 1. YouTube - Official Red rounded rectangle with centered white play triangle
  if (normalized.includes('youtube')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#FF0000" />
        <path d="M19 16L33 24L19 32V16Z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 2. Netflix - Official Black Card with Red Ribbon 'N'
  if (normalized.includes('netflix')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#000000" />
        {/* Left vertical pillar */}
        <path d="M12 9H18V39H12V9Z" fill="#E50914" />
        {/* Right vertical pillar */}
        <path d="M30 9H36V39H30V9Z" fill="#E50914" />
        {/* Diagonal ribbon with shadow */}
        <path d="M18 9H12L30 39H36L18 9Z" fill="#B81D24" />
      </svg>
    );
  }

  // 3. Disney+ Hotstar - Official Disney+ Hotstar Royal Blue Emblem with Hotstar Starburst & Disney Arc
  if (normalized.includes('hotstar') || normalized.includes('disney')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Deep Tech Blue Gradient Background */}
        <rect width="48" height="48" rx="11" fill="url(#hotstar-bg-clean)" />
        {/* Disney+ sweeping magic arch */}
        <path
          d="M8 32C14 17 28 12 40 16"
          stroke="url(#hotstar-arc-clean)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Official 8-point dynamic Hotstar starburst in vibrant cyan/white */}
        <path
          d="M24 13L26.5 20.5L34 19L29 24.5L35 29L27.5 29.5L28 37L23.5 31.5L18.5 37L19.5 29.5L12 29L18 24.5L13 19L20.5 20.5L24 13Z"
          fill="url(#hotstar-star-grad)"
        />
        {/* Center glowing core */}
        <circle cx="24.5" cy="25" r="3.2" fill="#FFFFFF" />
        <defs>
          <linearGradient id="hotstar-bg-clean" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#040E3E" />
            <stop offset="1" stopColor="#01147C" />
          </linearGradient>
          <linearGradient id="hotstar-arc-clean" x1="8" y1="32" x2="40" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0048FF" stopOpacity="0.2" />
            <stop offset="0.6" stopColor="#00D2FF" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient id="hotstar-star-grad" x1="12" y1="13" x2="35" y2="37" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5FF" />
            <stop offset="0.5" stopColor="#00A2FF" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 4. Amazon Prime Video - Midnight Blue with official bold "prime" & vibrant Cyan Smile Arrow
  if (normalized.includes('prime') || normalized.includes('amazon')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#00053D" />
        {/* "prime" official typography */}
        <text
          x="24"
          y="24"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="13"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5px"
        >
          prime
        </text>
        {/* Official Amazon curved smile arrow */}
        <path
          d="M13 32C19 36.5 29 36.5 35 32"
          stroke="#00A8E1"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Arrowhead */}
        <path
          d="M33.5 30L36 32.5L33 34.5"
          stroke="#00A8E1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // 5. JioCinema - Official Jio vibrant magenta badge with crisp white Jio circle
  if (normalized.includes('jio')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#D91656" />
        {/* Jio outer ring */}
        <circle cx="24" cy="24" r="15" stroke="#FFFFFF" strokeWidth="2.2" strokeOpacity="0.8" />
        {/* Jio bold typography */}
        <text
          x="24"
          y="29"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="14"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5px"
        >
          Jio
        </text>
      </svg>
    );
  }

  // 6. Sony LIV - Official 4 multicolored geometric squares & LIV
  if (normalized.includes('sonyliv') || normalized.includes('sony')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#14141E" />
        {/* 4 Iconic Sony LIV Squares */}
        <rect x="13" y="11" width="9" height="9" rx="2.5" fill="#FF5E00" />
        <rect x="26" y="11" width="9" height="9" rx="2.5" fill="#00D26A" />
        <rect x="13" y="23" width="9" height="9" rx="2.5" fill="#0075FF" />
        <rect x="26" y="23" width="9" height="9" rx="2.5" fill="#FFB800" />
        {/* LIV text */}
        <text
          x="24"
          y="40"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1px"
        >
          LIV
        </text>
      </svg>
    );
  }

  // 7. Zee5 - Official Rainbow Circular Ribbon & 5
  if (normalized.includes('zee5') || normalized.includes('zee')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#1C102F" />
        <circle cx="24" cy="24" r="14" stroke="url(#zee-rainbow-clean)" strokeWidth="3.5" />
        <text
          x="24"
          y="30"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="17"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          5
        </text>
        <defs>
          <linearGradient id="zee-rainbow-clean" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8A2BE2" />
            <stop offset="0.3" stopColor="#FF1493" />
            <stop offset="0.7" stopColor="#FF4500" />
            <stop offset="1" stopColor="#FFD700" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 8. MX Player - Official Royal Blue with White 'MX' and Cyan Play Triangle
  if (normalized.includes('mxplayer') || normalized.includes('mx')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#0052FF" />
        {/* MX Monogram */}
        <text
          x="19"
          y="30"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="16"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5px"
        >
          M
        </text>
        {/* Play triangle chevron */}
        <path d="M28 17L38 24.5L28 32V17Z" fill="#38BDF8" />
      </svg>
    );
  }

  // 9. Spotify - Official Black Card with Bright Green Spotify Emblem
  if (normalized.includes('spotify')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#121212" />
        <circle cx="24" cy="24" r="16" fill="#1DB954" />
        {/* 3 curved sound wave lines */}
        <path
          d="M15 19C21 17 28 17.5 33 20.5"
          stroke="#000000"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M16 24C21 22.3 27 22.8 32 25.3"
          stroke="#000000"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M17 29C21.5 27.5 26.5 28 31 30"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // 10. Apple TV+ - Official Black Card with White Apple Silhouette & 'tv'
  if (normalized.includes('appletv') || normalized.includes('apple')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#000000" />
        <path
          d="M20 18C20 15 22 13.5 22.2 13.3C20.8 11.2 18.5 11 17.7 11C15.8 10.7 14 12 13 12C12 12 10.5 10.8 9 11C7 11 5.2 12.2 5.2 15C5.2 19.5 8 26 10 29C11 30.5 12 32 13.5 32C15 32 15.7 31 17.3 31C19 31 19.5 32 21 32C22.6 32 23.6 30.5 24.5 29C25.5 27.5 26 26.8 26.5 25.8C24.5 25 23.2 23.2 23.2 21C23.2 19 20 18 20 18Z"
          fill="#FFFFFF"
          transform="translate(2, 0) scale(0.9)"
        />
        <text
          x="32"
          y="28"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="11"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          tv
        </text>
      </svg>
    );
  }

  // 11. VLC - Orange Traffic Cone with white bands
  if (normalized.includes('vlc')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#1E293B" />
        <path d="M24 8L29 18H19L24 8Z" fill="#FF7700" />
        <path d="M29 18L32 26H16L19 18H29Z" fill="#FFFFFF" />
        <path d="M32 26L35 34H13L16 26H32Z" fill="#FF7700" />
        <rect x="10" y="34" width="28" height="4" rx="2" fill="#FFFFFF" />
      </svg>
    );
  }

  // 12. Google Play Store
  if (normalized.includes('play') || normalized.includes('store')) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="11" fill="#1E293B" />
        <path d="M10 10L30 24L10 38V10Z" fill="#00C4FF" />
        <path d="M10 10L27 27L30 24L10 10Z" fill="#00E676" />
        <path d="M30 24L27 27L34 31L38 27L30 24Z" fill="#FFD600" />
        <path d="M10 38L27 21L34 25L10 38Z" fill="#FF3D00" />
      </svg>
    );
  }

  // Generic fallback
  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 flex items-center justify-center font-bold text-white text-[11px] uppercase ${className}`}
      style={style}
    >
      {appId.substring(0, 2)}
    </div>
  );
};
