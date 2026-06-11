"use client";

import { useState } from "react";
import { MapPin, CalendarDays, Globe, ArrowUpRight, Check } from "lucide-react";
import type { MatchedOption } from "@/lib/matcher";
import { staticMapUrl, googleMapsUrl } from "@/lib/maps/mapbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  options: MatchedOption[];
  onDid: (activityId: number) => void;
  disabled: boolean;
}

/**
 * The locations "deck": a horizontal snap-scroll carousel of paper preview
 * cards (map header + name). Tapping a card opens a detail dialog with the
 * full info for that spot.
 */
export function LocationDeck({ options, onDid, disabled }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = options[openIndex ?? -1];

  return (
    <>
      <div
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 pt-1 select-none"
        role="list"
      >
        {options.map((option, i) => (
          <PreviewCard key={option.id} option={option} onOpen={() => setOpenIndex(i)} />
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenIndex(null)}>
        {open && (
          <LocationDialog
            option={open}
            disabled={disabled}
            onDid={() => {
              const id = open.id;
              setOpenIndex(null);
              onDid(id);
            }}
          />
        )}
      </Dialog>
    </>
  );
}

/** Paper card in the carousel: map header + name. Opens the dialog on click. */
function PreviewCard({ option, onOpen }: { option: MatchedOption; onOpen: () => void }) {
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
        "group block w-44 shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-card text-left shadow-paper",
        "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lift",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="relative h-24 bg-secondary">
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
          <div className="grid h-full w-full place-items-center text-muted-foreground" aria-hidden>
            <MapPin className="h-6 w-6" />
          </div>
        )}
        {distance && (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold text-foreground/80 ring-1 ring-border/60 backdrop-blur-sm">
            <MapPin className="h-2.5 w-2.5" />
            {distance}
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <h3 className="truncate font-display text-[0.95rem] font-semibold leading-tight">
          {option.title}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {option.location_name ?? option.borough ?? "NYC"}
        </p>
      </div>
    </button>
  );
}

/** Full-detail dialog for one location. */
function LocationDialog({
  option,
  disabled,
  onDid,
}: {
  option: MatchedOption;
  disabled: boolean;
  onDid: () => void;
}) {
  const mapUrl =
    option.lat != null && option.lng != null
      ? staticMapUrl({ lat: option.lat, lng: option.lng, width: 640, height: 360, zoom: 15 })
      : null;
  const place = option.location_name ?? option.borough ?? "NYC";
  const distance = option.distanceKm != null ? `${option.distanceKm.toFixed(1)} km away` : null;
  const hasCoords = option.lat != null && option.lng != null;

  return (
    <DialogContent aria-describedby={undefined}>
      <div className="relative h-44 bg-secondary">
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
              <div className="grid h-full w-full place-items-center text-muted-foreground" aria-hidden>
                <MapPin className="h-8 w-8" />
              </div>
            )}
          </a>
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground" aria-hidden>
            <MapPin className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="p-5 pt-1">
        <DialogTitle className="text-xl">{option.title}</DialogTitle>
        <DialogDescription className="mt-1 font-medium text-foreground/70">{place}</DialogDescription>
        {option.address && <p className="text-xs text-muted-foreground">{option.address}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="default">
            <WhenIcon option={option} />
            {formatWhen(option)}
          </Badge>
          {distance && (
            <Badge variant="teal">
              <MapPin className="h-3 w-3" />
              {distance}
            </Badge>
          )}
          {option.borough && <Badge variant="secondary">{option.borough}</Badge>}
        </div>

        <div className="mt-5 flex gap-2">
          <Button asChild variant="outline" className="flex-1 rounded-full">
            <a href={option.url} target="_blank" rel="noopener noreferrer">
              Details <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
          <Button onClick={onDid} disabled={disabled} className="flex-1 rounded-full">
            <Check className="h-4 w-4" />
            I did this
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function WhenIcon({ option }: { option: MatchedOption }) {
  if (!option.start_date && !option.end_date) return <Globe className="h-3 w-3" />;
  return <CalendarDays className="h-3 w-3" />;
}

/** Friendly date line: evergreen, a single day, or a range. */
function formatWhen(o: MatchedOption): string {
  if (!o.start_date && !o.end_date) return "Anytime";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (o.start_date && o.end_date && o.start_date !== o.end_date) {
    return `${fmt(o.start_date)} – ${fmt(o.end_date)}`;
  }
  return fmt((o.start_date ?? o.end_date)!);
}
