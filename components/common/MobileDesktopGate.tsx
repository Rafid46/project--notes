import Image from "next/image";
import { FolderOpen, Layers, Monitor, Sparkles } from "lucide-react";

export default function MobileDesktopGate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <section
        aria-label="Desktop view required"
        className="flex md:hidden min-h-screen w-full items-center justify-center bg-background px-5 py-10 text-foreground"
        style={{
          backgroundImage:
            "radial-gradient(var(--dot-color) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-3xl border border-border/80 bg-background/90 px-6 py-8 text-center shadow-[0_24px_64px_-16px_rgba(0,0,0,0.18)] backdrop-blur-md dark:shadow-[0_28px_72px_-16px_rgba(0,0,0,0.6)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 h-36 w-56 rounded-full bg-[#BBDC12]/20 blur-3xl"
          />

          <Image
            src="/assets/hane.png"
            alt="Hane Notes"
            width={92}
            height={36}
            priority
            className="relative mb-5 h-7 w-auto rounded-md object-contain"
          />

          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#BBDC12] text-[#004030] shadow-xs">
            <Monitor size={26} />
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#BBDC12]/40 bg-[#BBDC12]/15 px-3 py-1 text-[11px] font-semibold uppercase text-[#4d6100] dark:text-[#BBDC12]">
            Desktop View Only
          </span>

          <h1 className="mt-3 text-xl font-bold leading-snug text-foreground">
            Open on a{" "}
            <span className="inline-block rounded-lg bg-[#BBDC12] px-2 py-0.5 text-[#004030]">
              wider screen
            </span>
          </h1>

          <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
            Hane Notes is designed for spatial whiteboards, drag-and-drop note
            cards, and local folder boards. Switch to a desktop or laptop to
            use the workspace.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border/60 pt-4 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers size={12} />
              Whiteboard
            </span>
            <span className="inline-flex items-center gap-1">
              <FolderOpen size={12} />
              Folder Board
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles size={12} />
              AI Notes
            </span>
          </div>
        </div>
      </section>

      <div className="hidden md:contents">{children}</div>
    </>
  );
}
