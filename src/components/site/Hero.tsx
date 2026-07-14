import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Smartphone,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolPickerModal } from "./ToolPickerModal";
import { setPendingFiles } from "@/lib/pending-file";

const trustChips = [
  { label: "Free to use", icon: CheckCircle2 },
  { label: "Fast processing", icon: Zap },
  { label: "Secure handling", icon: ShieldCheck },
  { label: "Works on phone", icon: Smartphone },
];

export function Hero() {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    if (f) {
      setPendingFiles([f]);
      setPickerOpen(true);
    }
  };

  return (
    <section id="upload" className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 bg-gradient-mesh" />
      <div className="absolute inset-0 -z-10 [background:var(--gradient-hero)]" />
      <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-20 -right-32 w-[520px] h-[520px] rounded-full bg-primary-glow/25 blur-3xl animate-blob [animation-delay:-6s]" />

      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-700 shadow-[0_1px_0_rgba(37,99,235,0.08)] transition-none">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Fast PDF tools for everyday work
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
            Convert & Manage PDFs <br className="hidden sm:block" />
            <span className="text-gradient">Instantly.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Fast, secure PDF tools — all in your browser.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="default"
              size="xl"
              className="h-14 w-[228px] rounded-[21px] border border-white/35 !bg-[linear-gradient(135deg,#064FE8_0%,#087BFF_54%,#00A3FF_100%)] px-8 text-base font-extrabold text-white !shadow-[0_10px_24px_rgba(7,91,255,0.30)] transition-none hover:translate-y-0 hover:!bg-[linear-gradient(135deg,#0547D1_0%,#076EE8_54%,#0094EA_100%)] hover:!shadow-[0_10px_24px_rgba(7,91,255,0.30)] active:translate-y-0 active:!bg-[linear-gradient(135deg,#043DB5_0%,#065FCB_54%,#0082D2_100%)] focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2 sm:h-12 sm:w-auto sm:min-w-[184px] sm:rounded-2xl sm:border-white/25 sm:!bg-[#1677FF] sm:!bg-none sm:px-8 sm:font-semibold sm:!shadow-[0_8px_20px_rgba(22,119,255,0.22)] sm:hover:!bg-[#0F68E8] sm:hover:!bg-none sm:hover:!shadow-[0_8px_20px_rgba(22,119,255,0.24)] sm:active:!bg-[#0B5CCD] sm:active:!bg-none"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-5 w-5 text-white" /> Upload PDF
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="h-[54px] w-[196px] rounded-[20px] border-blue-200/80 !bg-white/70 px-7 text-base font-semibold text-slate-800 !shadow-none transition-none hover:border-blue-300 hover:!bg-white/90 hover:text-slate-900 sm:w-auto sm:min-w-[190px]"
              asChild
            >
              <a href="#tools">
                Explore Tools <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Dropzone */}
        <div className="mx-auto mt-10 max-w-3xl animate-fade-up [animation-delay:120ms] sm:mt-12">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "group relative block cursor-pointer rounded-3xl p-8 text-center transition-[background-color,border-color,box-shadow,transform] duration-200 sm:p-12",
              "glass shadow-card hover:shadow-glow",
              drag && "ring-2 ring-primary scale-[1.01]",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <div className="mx-auto mb-5 grid place-items-center w-16 h-16 rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            {file ? (
              <p className="responsive-file-name mx-auto text-lg font-medium" title={file.name}>
                {file.name}
              </p>
            ) : (
              <p className="mx-auto max-w-[18rem] text-base font-semibold leading-snug sm:max-w-none sm:text-lg">
                <span className="sm:hidden">Tap to upload your PDF</span>
                <span className="hidden sm:inline">Drag &amp; drop your PDF here, or browse</span>
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a PDF to start, then pick the tool you need.
            </p>

            <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-xs text-muted-foreground sm:max-w-none sm:grid-cols-4 sm:gap-4">
              {trustChips.map((chip) => {
                const Icon = chip.icon;

                return (
                  <span key={chip.label} className="inline-flex items-center justify-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {chip.label}
                  </span>
                );
              })}
            </div>
          </label>
        </div>

        {/* Floating mockups */}
        <FloatingCards />
      </div>

      <ToolPickerModal open={pickerOpen} onOpenChange={setPickerOpen} file={file} />
    </section>
  );
}

function FloatingCards() {
  return (
    <div className="pointer-events-none hidden lg:block">
      <div className="absolute left-8 top-44 animate-float">
        <div className="glass rounded-2xl p-4 w-56 shadow-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-medium">report-q4.pdf</div>
              <div className="text-muted-foreground">2.4 MB · Converted</div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-full bg-gradient-primary" />
          </div>
        </div>
      </div>
      <div className="absolute right-8 top-60 animate-float-slow">
        <div className="glass rounded-2xl p-4 w-60 shadow-card">
          <div className="text-xs font-medium mb-2">Compress PDF</div>
          <div className="flex items-end gap-1 h-12">
            {[40, 70, 50, 80, 35, 90, 60].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 rounded-sm bg-gradient-primary opacity-80"
              />
            ))}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">−68% file size</div>
        </div>
      </div>
    </div>
  );
}
