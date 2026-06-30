import { useRef, useState } from "react";
import { Upload, Sparkles, FileText, ArrowRight, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolPickerModal } from "./ToolPickerModal";
import { setPendingFiles } from "@/lib/pending-file";

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
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-foreground/80">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Trusted by 2M+ users worldwide
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
            Convert & Manage PDFs <br className="hidden sm:block" />
            <span className="text-gradient">Instantly.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Fast, secure PDF tools — all in your browser.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button variant="hero" size="xl" onClick={() => inputRef.current?.click()}>
              <Upload className="w-5 h-5" /> Upload PDF
            </Button>
            <Button variant="glass" size="xl" asChild>
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
            <p className="responsive-file-name mx-auto text-lg font-medium" title={file?.name}>
              {file ? file.name : "Drop your PDF here or click to browse"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Files are processed securely and deleted after 1 hour.
            </p>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> Secure
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" /> Lightning fast
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" /> All formats
              </span>
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
