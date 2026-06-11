"use client";

import { useEffect, useState } from "react";
import type { MatchedOption } from "@/lib/matcher";
import { staticMapUrl, googleMapsUrl } from "@/lib/maps/mapbox";
import { cn } from "@/lib/utils";

interface Props {
  options: MatchedOption[];
  onDid: (activityId: number) => void;
  disabled: boolean;
}

/**
 * The locations "deck": a horizontal snap-scroll carousel of clay preview
 * cards (map header + name). Hover nudges a card up; tapping opens a detail
 * modal with the full info for that spot.
 */
export function LocationDeck({ options, onDid, disabled }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 pt-1 select-none"
        role="list"
      >
        {options.map((option, i) => (
          <PreviewCard
            key={option.id}
            option={option}
            onOpen={() => setOpenIndex(i)}
          />
        ))}
      </div>

      {openIndex != null && options[openIndex] && (
        <LocationModal
          option={options[openIndex]}
          disabled={disabled}
          onClose={() => setOpenIndex(null)}
          onDid={() => {
            const id = options[openIndex].id;
            setOpenIndex(null);
            onDid(id);
          }}
        />
      )}
    </>
  );
}

/** Clay card in the carousel: map header + name. Opens the modal on click. */
function PreviewCard({
  option,
  onOpen,
}: {
  option: MatchedOption;
  onOpen: () => void;
}) {
  const mapUrl =
    option.lat != null && option.lng != null
      ? staticMapUrl({ lat: option.lat, lng: option.lng, width: 360, height: 200 })
      : null;
  const distance = option.distanceKm != null ? `${option.distanceKm.toFixed(1)} km` : null;

  return (
    <button
      type="button"
      role="listitem"
      onClick={onOpen}
      aria-label={`Open ${option.title}`}
      className={cn(
        "group block w-44 shrink-0 snap-start overflow-hidden rounded-card border-2 border-white bg-white text-left shadow-clay",
        "transition-transform duration-200 ease-out will-change-transform",
        "hover:-translate-y-1.5 focus-visible:-translate-y-1.5 active:scale-[0.97]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-coral",
      )}
    >
      <div className="relative h-24 bg-gradient-to-br from-sky-soft via-sky/40 to-sun-soft">
        {mapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mapUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl" aria-hidden>
            📍
          </div>
        )}
        {distance && (
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-foreground/80 shadow-sm">
            {distance}
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <h3 className="truncate text-sm font-bold leading-tight">{option.title}</h3>
        <p className="mt-0.5 truncate text-[11px] font-medium text-foreground/55">
          {option.location_name ?? option.borough ?? "NYC"}
        </p>
      </div>
    </button>
  );
}

/** Full-detail modal for one location. Esc / backdrop / X to close. */
function LocationModal({
  option,
  disabled,
  onClose,
  onDid,
}: {
  option: MatchedOption;
  disabled: boolean;
  onClose: () => void;
  onDid: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mapUrl =
    option.lat != null && option.lng != null
      ? staticMapUrl({ lat: option.lat, lng: option.lng, width: 640, height: 360, zoom: 15 })
      : null;
  const place = option.location_name ?? option.borough ?? "NYC";
  const distance = option.distanceKm != null ? `${option.distanceKm.toFixed(1)} km away` : null;
  const hasCoords = option.lat != null && option.lng != null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={option.title}
    >
      <div
        className="w-full max-w-sm animate-pop-in overflow-hidden rounded-card border-2 border-white bg-white shadow-clay"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-44 bg-gradient-to-br from-sky-soft via-sky/40 to-sun-soft">
          {hasCoords ? (
            <a
              href={googleMapsUrl(option.lat!, option.lng!)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${place} in Google Maps`}
              className="block h-full w-full"
            >
              {mapUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mapUrl} alt={`Map of ${place}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
                  📍
                </div>
              )}
            </a>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
              📍
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg font-bold text-foreground/70 shadow-sm transition active:scale-95"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <h3 className="font-display text-xl font-semibold leading-tight">{option.title}</h3>
          <p className="mt-1 text-sm font-medium text-foreground/65">{place}</p>
          {option.address && <p className="text-xs text-foreground/50">{option.address}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-foreground/70">
            <span className="rounded-full bg-sun-soft/50 px-3 py-1">{formatWhen(option)}</span>
            {distance && <span className="rounded-full bg-sky-soft/40 px-3 py-1">📍 {distance}</span>}
            {option.borough && <span className="rounded-full bg-grape-soft/40 px-3 py-1">{option.borough}</span>}
          </div>

          <div className="mt-5 flex gap-2">
            <a
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full border-2 border-foreground/15 bg-white py-3 text-center text-sm font-bold text-foreground/70 transition hover:bg-foreground/5 active:scale-[0.97]"
            >
              Details ↗
            </a>
            <button
              onClick={onDid}
              disabled={disabled}
              className="flex-1 rounded-full bg-coral py-3 text-center font-display text-sm font-semibold text-white shadow-pop-coral transition-transform active:translate-y-1 active:shadow-none disabled:opacity-60"
            >
              I did this ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Friendly date line: evergreen, a single day, or a range. */
function formatWhen(o: MatchedOption): string {
  if (!o.start_date && !o.end_date) return "🌎 Anytime";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (o.start_date && o.end_date && o.start_date !== o.end_date) {
    return `📅 ${fmt(o.start_date)} – ${fmt(o.end_date)}`;
  }
  return `📅 ${fmt((o.start_date ?? o.end_date)!)}`;
}
