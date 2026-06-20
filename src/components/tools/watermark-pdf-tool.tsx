import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Shield,
  Type,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PdfPagePreview } from "@/components/tools/pdf-page-preview";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import { lockPdfOverlayTouchDrag } from "@/lib/pdf-overlay-drag";
import { createPdfDownloadUrl, revokeObjectUrl, watermarkPdf } from "@/lib/pdf-watermark";

type ToolStatus = "idle" | "processing" | "done" | "error";

type WatermarkPosition = {
  x: number;
  y: number;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function getDownloadName(file: File | null) {
  if (!file) return "watermarked.pdf";
  return `${file.name.replace(/\.pdf$/i, "")}-watermarked.pdf`;
}

function getRotationLabel(rotation: number) {
  if (rotation === 0) return "Rotation: 0\u00b0";
  return `${rotation}\u00b0 ${rotation > 0 ? "clockwise" : "counter-clockwise"}`;
}

export function WatermarkPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const watermarkDragRef = useRef(false);
  const unlockTouchDragRef = useRef<(() => void) | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("watermarked.pdf");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.36);
  const [fontSize, setFontSize] = useState(56);
  const [rotation, setRotation] = useState(-35);
  const [color, setColor] = useState("#111827");
  const [position, setPosition] = useState<WatermarkPosition>({ x: 0.5, y: 0.5 });
  const [watermarkDragging, setWatermarkDragging] = useState(false);

  useEffect(() => {
    const pending = consumePendingFiles(".pdf,application/pdf", false);
    if (pending?.[0]) {
      selectFile(pending[0]);
    }
    // Pending-file bootstrapping should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl(downloadUrl);
      unlockTouchDragRef.current?.();
      unlockTouchDragRef.current = null;
    };
  }, [downloadUrl]);

  const fileSize = useMemo(() => (file ? formatFileSize(file.size) : null), [file]);

  const resetResultState = (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(nextFile));
    setStatus("idle");
    setError(null);
    setProgressNote("Waiting for file");
  };

  const selectFile = (nextFile: File | null) => {
    resetResultState(nextFile);
    setFile(nextFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    try {
      setStatus("processing");
      setError(null);
      setProgressNote("Adding watermark to every page...");

      const bytes = await watermarkPdf(file, {
        text: watermarkText,
        opacity,
        fontSize,
        rotation,
        color,
        x: position.x,
        y: position.y,
      });
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setProgressNote("Your watermarked PDF is ready.");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Watermark failed. Please try again.");
      setStatus("error");
      setProgressNote("Watermark failed.");
    }
  };

  const resetWatermarkPosition = () => {
    setPosition({ x: 0.5, y: 0.5 });
  };

  const updateWatermarkPosition = (
    event: PointerEvent<HTMLElement>,
    renderSize: { width: number; height: number },
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - bounds.left) / renderSize.width);
    const y = clamp(1 - (event.clientY - bounds.top) / renderSize.height);
    setPosition({ x, y });
  };

  const startWatermarkDrag = (
    event: PointerEvent<HTMLDivElement>,
    renderSize: { width: number; height: number },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    unlockTouchDragRef.current?.();
    unlockTouchDragRef.current = lockPdfOverlayTouchDrag(event.pointerType);
    watermarkDragRef.current = true;
    setWatermarkDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateWatermarkPosition(event, renderSize);
  };

  const moveWatermarkDrag = (
    event: PointerEvent<HTMLDivElement>,
    renderSize: { width: number; height: number },
  ) => {
    if (!watermarkDragRef.current) return;
    event.preventDefault();
    updateWatermarkPosition(event, renderSize);
  };

  const stopWatermarkDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!watermarkDragRef.current) return;
    event.preventDefault();
    watermarkDragRef.current = false;
    setWatermarkDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    unlockTouchDragRef.current?.();
    unlockTouchDragRef.current = null;
  };

  return (
    <>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          selectFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "group relative block cursor-pointer rounded-3xl p-10 text-center transition-all duration-300 sm:p-16",
          "glass shadow-card hover:shadow-glow",
          drag && "scale-[1.01] ring-2 ring-primary",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="text-lg font-medium">
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one PDF, add custom watermark text, and download a protected copy.
        </p>
      </label>

      {file && (
        <div className="mt-5 rounded-2xl glass px-4 py-3 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">{fileSize}</div>
              </div>
            </div>
            {status !== "processing" && (
              <button
                type="button"
                onClick={() => selectFile(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {file && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 text-sm font-medium">Watermark settings</div>
          <div className="grid gap-4">
            <Input
              value={watermarkText}
              onChange={(event) => setWatermarkText(event.target.value)}
              placeholder="Watermark text"
              className="h-12 rounded-xl border-border bg-card/70 px-4 text-sm shadow-soft"
              disabled={status === "processing"}
            />
            <div className="grid gap-4 sm:grid-cols-4">
              <label className="text-xs text-muted-foreground">
                <div className="mb-2 flex items-center justify-between">
                  <span>Opacity</span>
                  <span className="text-foreground">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={80}
                  value={Math.round(opacity * 100)}
                  onChange={(event) => setOpacity(Number(event.target.value) / 100)}
                  className="w-full accent-primary"
                  disabled={status === "processing"}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                <div className="mb-2 flex items-center justify-between">
                  <span>Font size</span>
                  <span className="text-foreground">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={120}
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="w-full accent-primary"
                  disabled={status === "processing"}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                <div className="mb-2 flex items-center justify-between">
                  <span>Rotation</span>
                  <span className="text-foreground">{getRotationLabel(rotation)}</span>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  value={rotation}
                  onChange={(event) => setRotation(Number(event.target.value))}
                  className="w-full accent-primary"
                  disabled={status === "processing"}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                <div className="mb-2 flex items-center justify-between">
                  <span>Color</span>
                  <span className="text-foreground">{color.toUpperCase()}</span>
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-8 w-full cursor-pointer rounded-lg border border-border bg-card/70 p-1 shadow-soft"
                  disabled={status === "processing"}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card/70 px-3 py-2 text-xs text-muted-foreground shadow-soft">
              <span>Watermark position applies to every page.</span>
              <button
                type="button"
                onClick={resetWatermarkPosition}
                disabled={status === "processing"}
                className="font-medium text-primary hover:text-primary-glow disabled:pointer-events-none disabled:opacity-60"
              >
                Center
              </button>
            </div>
          </div>
        </div>
      )}

      {file && (
        <PdfPagePreview
          file={file}
          pageNumber={1}
          title="PDF preview"
          note="Watermark position applies to every page."
          overlay={(renderSize) => (
            <div
              className="absolute inset-0 touch-none overflow-hidden rounded-xl"
              onPointerDown={(event) => startWatermarkDrag(event, renderSize)}
              onPointerMove={(event) => moveWatermarkDrag(event, renderSize)}
              onPointerUp={stopWatermarkDrag}
              onPointerCancel={stopWatermarkDrag}
              onLostPointerCapture={stopWatermarkDrag}
            >
              <div
                className={cn(
                  "absolute max-w-[92%] touch-none select-none whitespace-nowrap text-center font-bold uppercase leading-none",
                  "cursor-move rounded-md px-2 py-1",
                  watermarkDragging && "outline outline-2 outline-primary/70",
                )}
                style={{
                  left: position.x * renderSize.width,
                  top: (1 - position.y) * renderSize.height,
                  fontSize: fontSize * renderSize.scale,
                  opacity,
                  color,
                  textShadow:
                    color.toLowerCase() === "#ffffff"
                      ? "0 0 1px rgba(0,0,0,0.75), 0 1px 2px rgba(0,0,0,0.35)"
                      : "0 0 1px rgba(255,255,255,0.8), 0 1px 2px rgba(255,255,255,0.35)",
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  transformOrigin: "center",
                  maxWidth: renderSize.width * 0.92,
                }}
              >
                {watermarkText.trim() || "WATERMARK"}
              </div>
            </div>
          )}
        />
      )}

      {status === "processing" && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {progressNote}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left animate-pulse bg-gradient-primary" />
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive shadow-soft">
          {error}
        </div>
      )}

      {status === "done" && downloadUrl && (
        <div className="mt-6 rounded-2xl glass p-6 text-center shadow-glow">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="font-semibold">Watermark added</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your watermarked PDF is ready to download.
          </p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-card/70 p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Watermark</span>
              <span className="truncate font-medium text-foreground">{watermarkText}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Opacity</span>
              <span className="font-medium text-foreground">{Math.round(opacity * 100)}%</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName}>
                <Download className="h-4 w-4" /> Download Watermarked PDF
              </a>
            </Button>
            <Button variant="glass" size="lg" onClick={() => selectFile(null)}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {status !== "done" && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="hero"
            size="xl"
            onClick={handleSubmit}
            disabled={status === "processing"}
          >
            {file ? (
              <>
                Add Watermark <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" /> Choose PDF
              </>
            )}
          </Button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Client-side only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5 text-primary" /> Custom text
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Powered by pdf-lib
        </span>
      </div>
    </>
  );
}
