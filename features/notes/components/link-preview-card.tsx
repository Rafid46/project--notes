"use client";

import { useState } from "react";
import type { LinkPreviewMetadata } from "@/features/home/types";
import { ExternalLink, Globe, X } from "lucide-react";

interface LinkPreviewCardProps {
  preview: LinkPreviewMetadata;
  onRemove?: () => void;
  className?: string;
}

export default function LinkPreviewCard({
  preview,
  onRemove,
  className = "",
}: LinkPreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  return (
    <div
      className={`group/card relative flex flex-row items-stretch rounded-xl border border-border/80 bg-card/95 hover:bg-accent/40 hover:border-border transition-all duration-200 overflow-hidden shadow-xs text-left w-full ${className}`}
    >
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-row items-stretch flex-1 min-w-0"
      >
        {preview.image && !imageError ? (
          <div className="relative w-28 sm:w-36 md:w-44 shrink-0 bg-muted overflow-hidden flex items-center justify-center">
            <img
              src={preview.image}
              alt={preview.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-20 sm:w-24 shrink-0 bg-muted flex items-center justify-center text-muted-foreground">
            <Globe size={24} />
          </div>
        )}

        <div className="flex flex-col justify-between flex-1 min-w-0 p-3 sm:p-3.5">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              {preview.favicon && !faviconError ? (
                <img
                  src={preview.favicon}
                  alt=""
                  onError={() => setFaviconError(true)}
                  className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain"
                />
              ) : (
                <Globe size={14} className="text-muted-foreground shrink-0" />
              )}
              {preview.siteName && (
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {preview.siteName}
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover/card:text-blue-500 transition-colors">
              {preview.title}
            </h4>

            {preview.description && (
              <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {preview.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline truncate mt-2">
            <span className="truncate">{preview.url}</span>
            <ExternalLink size={10} className="shrink-0 opacity-70" />
          </div>
        </div>
      </a>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer shadow-xs z-10"
          title="Remove preview"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
