import React from "react";

interface LogoProps {
  layout?: "full" | "simple" | "icon";
  className?: string;
  light?: boolean;
}

export default function Logo({ layout = "full", className = "", light = false }: LogoProps) {
  const brandColor = light ? "text-white" : "text-[#1C335E]";
  const subtextColor = light ? "text-white/70" : "text-[#6F7B8E]";

  // The custom K icon SVG
  const IconSvg = () => (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full drop-shadow-sm select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left/Bottom segment - Navy Blue */}
      <path
        d="M 8 30 L 8 70 L 50 94 L 75 80 L 67 71 L 50 81 L 24 66 L 24 37 L 46 24 L 46 12 Z"
        fill={light ? "#FFFFFF" : "#1C335E"}
      />
      {/* Top/Right segment - Orange */}
      <path
        d="M 54 8 L 92 30 L 92 70 L 80 77 L 80 43 L 54 28 Z"
        fill="#ED6A21"
      />
    </svg>
  );

  if (layout === "icon") {
    return (
      <div className={`w-12 h-12 ${className}`}>
        <IconSvg />
      </div>
    );
  }

  if (layout === "simple") {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        <div className="w-11 h-11 shrink-0">
          <IconSvg />
        </div>
        <div className="flex flex-col">
          <span className={`font-serif font-black tracking-wide text-lg leading-tight uppercase ${brandColor}`}>
            Kohlico
          </span>
          <span className={`font-sans font-bold tracking-widest text-[9px] uppercase leading-none opacity-80 ${subtextColor}`}>
            Foods & Beverages
          </span>
        </div>
      </div>
    );
  }

  // Full Layout (Logo icon and brand name only)
  return (
    <div className={`flex items-center gap-4 border border-[#D8D6D3]/40 p-4 sm:p-5 bg-white shadow-sm ${className}`}>
      {/* Stylized K Logo Icon */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
        <IconSvg />
      </div>

      {/* Brand Name */}
      <h2 className="font-serif font-extrabold text-lg sm:text-xl md:text-2xl text-[#1C335E] tracking-normal leading-tight uppercase">
        Kohlico Foods and Beverages Pvt Ltd
      </h2>
    </div>
  );
}
