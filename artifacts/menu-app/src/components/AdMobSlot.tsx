import { ShieldCheck } from "lucide-react";

type AdMobSlotProps = {
  placement?: "home-feed" | "book-detail";
};

/**
 * Reserved ad surface. The production AdMob/AdSense identifiers can be
 * supplied later through public VITE_* configuration without changing layout.
 */
export default function AdMobSlot({ placement = "home-feed" }: AdMobSlotProps) {
  const publisherId = import.meta.env.VITE_ADMOB_PUBLISHER_ID as string | undefined;
  const slotId = import.meta.env.VITE_ADMOB_SLOT_ID as string | undefined;

  return (
    <aside
      className="relative min-h-[84px] overflow-hidden rounded-2xl border border-white/10 bg-black/15"
      data-ad-placement={placement}
      data-ad-client={publisherId || undefined}
      data-ad-slot={slotId || undefined}
      aria-label="Espacio publicitario"
    >
      <div className="flex min-h-[84px] items-center justify-center gap-2 px-4 text-center">
        <ShieldCheck className="h-4 w-4 text-white/25" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Espacio AdMob</p>
          <p className="mt-1 text-[10px] text-white/25">
            {publisherId && slotId ? "Listo para conectar el anuncio" : "Reserva publicitaria de AudiVerse"}
          </p>
        </div>
      </div>
    </aside>
  );
}