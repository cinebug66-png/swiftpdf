import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crop,
  Download,
  FileText,
  Loader2,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PdfPagePreview } from "@/components/tools/pdf-page-preview";
import { trackEvent } from "@/lib/analytics";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  createPdfDownloadUrl,
  cropMarginsToRect,
  cropPdf,
  cropRectToMargins,
  getPdfPageCount,
  normalizeCropRect,
  revokeObjectUrl,
  validateCropRect,
  type CropRect,
  type CropScope,
} from "@/lib/pdf-crop";
import { cn } from "@/lib/utils";

type ToolStatus = "idle" | "processing" | "done" | "error";
type CropMode = "custom" | "full-page" | "remove-margins" | "square" | "a4" | "letter" | "16-9" | "4-3";
type DragKind = "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

type PointerState = {
  kind: DragKind;
  pointerId: number;
  startX: number;
  startY: number;
  startRect: CropRect;
  previewWidth: number;
  previewHeight: number;
};

const defaultRect: CropRect = { x: 0, y: 0, width: 100, height: 100 };
const removeMarginsRect: CropRect = { x: 8, y: 8, width: 84, height: 84 };
const minCropPercent = 5;

const cropModes: { id: CropMode; label: string; ratio?: number; rect?: CropRect }[] = [
  { id: "custom", label: "Custom" },
  { id: "full-page", label: "Full page", rect: defaultRect },
  { id: "remove-margins", label: "Remove margins", rect: removeMarginsRect },
  { id: "square", label: "Square", ratio: 1 },
  { id: "a4", label: "A4", ratio: 210 / 297 },
  { id: "letter", label: "Letter", ratio: 8.5 / 11 },
  { id: "16-9", label: "16:9", ratio: 16 / 9 },
  { id: "4-3", label: "4:3", ratio: 4 / 3 },
];

const analyticsBase = {
  tool_name: "Crop PDF",
  tool_slug: "crop-pdf",
  input_type: "pdf",
  output_type: "pdf",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getDownloadName(file: File | null) {
  if (!file) return "cropped.pdf";
  return `${file.name.replace(/\.pdf$/i, "")}-cropped.pdf`;
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function getModeRatio(mode: CropMode) {
  return cropModes.find((item) => item.id === mode)?.ratio;
}

function fitRatioRect(ratio: number, pageAspect: number, current: CropRect = removeMarginsRect): CropRect {
  const percentRatio = ratio / pageAspect;
  const centerX = current.x + current.width / 2;
  const centerY = current.y + current.height / 2;
  let width = Math.min(current.width, 86);
  let height = width / percentRatio;

  if (height > 86) {
    height = 86;
    width = height * percentRatio;
  }

  return normalizeCropRect({
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  });
}

function resizeWithRatio(
  rect: CropRect,
  ratio: number,
  pageAspect: number,
  anchorX: number,
  anchorY: number,
) {
  const percentRatio = ratio / pageAspect;
  let width = Math.max(rect.width, minCropPercent);
  let height = width / percentRatio;

  if (height < minCropPercent) {
    height = minCropPercent;
    width = height * percentRatio;
  }

  if (width > 100) {
    width = 100;
    height = width / percentRatio;
  }

  if (height > 100) {
    height = 100;
    width = height * percentRatio;
  }

  return normalizeCropRect({
    x: anchorX - width / 2,
    y: anchorY - height / 2,
    width,
    height,
  });
}

function updateRectFromDrag(
  state: PointerState,
  clientX: number,
  clientY: number,
  ratio?: number,
  pageAspect = 1,
) {
  const dx = ((clientX - state.startX) / state.previewWidth) * 100;
  const dy = ((clientY - state.startY) / state.previewHeight) * 100;
  const start = state.startRect;

  if (state.kind === "move") {
    return normalizeCropRect({ ...start, x: start.x + dx, y: start.y + dy });
  }

  let left = start.x;
  let right = start.x + start.width;
  let top = start.y;
  let bottom = start.y + start.height;

  if (state.kind.includes("w")) left += dx;
  if (state.kind.includes("e")) right += dx;
  if (state.kind.includes("n")) top += dy;
  if (state.kind.includes("s")) bottom += dy;

  left = clamp(left, 0, right - minCropPercent);
  right = clamp(right, left + minCropPercent, 100);
  top = clamp(top, 0, bottom - minCropPercent);
  bottom = clamp(bottom, top + minCropPercent, 100);

  const next = normalizeCropRect({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });

  if (!ratio) return next;

  const anchorX = start.x + start.width / 2;
  const anchorY = start.y + start.height / 2;
  return resizeWithRatio(next, ratio, pageAspect, anchorX, anchorY);
}

function getDragKindFromPoint(clientX: number, clientY: number, root: HTMLElement, rect: CropRect) {
  const bounds = root.getBoundingClientRect();
  const left = bounds.left + (bounds.width * rect.x) / 100;
  const top = bounds.top + (bounds.height * rect.y) / 100;
  const right = left + (bounds.width * rect.width) / 100;
  const bottom = top + (bounds.height * rect.height) / 100;
  const handle = 18;
  const nearLeft = Math.abs(clientX - left) <= handle;
  const nearRight = Math.abs(clientX - right) <= handle;
  const nearTop = Math.abs(clientY - top) <= handle;
  const nearBottom = Math.abs(clientY - bottom) <= handle;
  const insideX = clientX >= left && clientX <= right;
  const insideY = clientY >= top && clientY <= bottom;
  const inHandleX = clientX >= left - handle && clientX <= right + handle;
  const inHandleY = clientY >= top - handle && clientY <= bottom + handle;

  if (nearLeft && nearTop) return "nw";
  if (nearRight && nearTop) return "ne";
  if (nearLeft && nearBottom) return "sw";
  if (nearRight && nearBottom) return "se";
  if (nearLeft && inHandleY) return "w";
  if (nearRight && inHandleY) return "e";
  if (nearTop && inHandleX) return "n";
  if (nearBottom && inHandleX) return "s";
  if (insideX && insideY) return "move";
  return null;
}

function NumberControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        type="number"
        min={0}
        max={95}
        step={0.5}
        value={Number(value.toFixed(1))}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 rounded-xl bg-card/70 text-sm"
      />
    </label>
  );
}

function CropOverlay({
  rect,
  mode,
  disabled,
  onRectChange,
  onUserEdit,
  pageAspect,
  onPageAspectChange,
}: {
  rect: CropRect;
  mode: CropMode;
  disabled: boolean;
  onRectChange: (rect: CropRect) => void;
  onUserEdit: () => void;
  pageAspect: number;
  onPageAspectChange: (pageAspect: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onPageAspectChange(pageAspect);
  }, [onPageAspectChange, pageAspect]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || disabled) return;

    const beginDrag = (
      kind: DragKind,
      clientX: number,
      clientY: number,
      id: number,
      source: "mouse" | "pointer" | "touch",
    ) => {
      const state: PointerState = {
        kind,
        pointerId: id,
        startX: clientX,
        startY: clientY,
        startRect: rect,
        previewWidth: root.clientWidth,
        previewHeight: root.clientHeight,
      };

      const move = (nextX: number, nextY: number) => {
        const ratio = getModeRatio(mode);
        onRectChange(updateRectFromDrag(state, nextX, nextY, ratio, pageAspect));
      };

      const mouseMove = (event: MouseEvent) => {
        event.preventDefault();
        move(event.clientX, event.clientY);
      };
      const mouseUp = () => {
        window.removeEventListener("mousemove", mouseMove);
        window.removeEventListener("mouseup", mouseUp);
        onUserEdit();
      };
      const pointerMove = (event: PointerEvent) => {
        if (event.pointerId !== id) return;
        event.preventDefault();
        move(event.clientX, event.clientY);
      };
      const pointerUp = (event: PointerEvent) => {
        if (event.pointerId !== id) return;
        window.removeEventListener("pointermove", pointerMove);
        window.removeEventListener("pointerup", pointerUp);
        window.removeEventListener("pointercancel", pointerUp);
        onUserEdit();
      };
      const touchMove = (event: TouchEvent) => {
        const touch = Array.from(event.touches).find((item) => item.identifier === id);
        if (!touch) return;
        event.preventDefault();
        move(touch.clientX, touch.clientY);
      };
      const touchEnd = () => {
        window.removeEventListener("touchmove", touchMove);
        window.removeEventListener("touchend", touchEnd);
        window.removeEventListener("touchcancel", touchEnd);
        onUserEdit();
      };

      if (source === "mouse") {
        window.addEventListener("mousemove", mouseMove, { passive: false });
        window.addEventListener("mouseup", mouseUp);
      } else if (source === "pointer") {
        window.addEventListener("pointermove", pointerMove, { passive: false });
        window.addEventListener("pointerup", pointerUp);
        window.addEventListener("pointercancel", pointerUp);
      } else {
        window.addEventListener("touchmove", touchMove, { passive: false });
        window.addEventListener("touchend", touchEnd);
        window.addEventListener("touchcancel", touchEnd);
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      const kind = getDragKindFromPoint(event.clientX, event.clientY, root, rect);
      if (!kind) return;
      event.preventDefault();
      beginDrag(kind, event.clientX, event.clientY, -1, "mouse");
    };
    const onPointerDown = (event: PointerEvent) => {
      const kind = getDragKindFromPoint(event.clientX, event.clientY, root, rect);
      if (!kind) return;
      event.preventDefault();
      beginDrag(kind, event.clientX, event.clientY, event.pointerId, "pointer");
    };
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const kind = getDragKindFromPoint(touch.clientX, touch.clientY, root, rect);
      if (!kind) return;
      event.preventDefault();
      beginDrag(kind, touch.clientX, touch.clientY, touch.identifier, "touch");
    };

    root.addEventListener("mousedown", onMouseDown);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("touchstart", onTouchStart, { passive: false });

    return () => {
      root.removeEventListener("mousedown", onMouseDown);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("touchstart", onTouchStart);
    };
  }, [disabled, mode, onRectChange, onUserEdit, pageAspect, rect]);

  const startMouseInteraction = (
    event: ReactMouseEvent<HTMLElement>,
    kind: DragKind,
    previewWidth: number,
    previewHeight: number,
  ) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();

    const state: PointerState = {
      kind,
      pointerId: -1,
      startX: event.clientX,
      startY: event.clientY,
      startRect: rect,
      previewWidth,
      previewHeight,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const ratio = getModeRatio(mode);
      onRectChange(updateRectFromDrag(state, moveEvent.clientX, moveEvent.clientY, ratio, pageAspect));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      onUserEdit();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
  };

  const startMouseFromOverlay = (event: ReactMouseEvent<HTMLElement>) => {
    const kind = getDragKindFromPoint(event.clientX, event.clientY, event.currentTarget, rect);
    if (!kind) return;
    startMouseInteraction(event, kind, event.currentTarget.clientWidth, event.currentTarget.clientHeight);
  };

  const startPointerFromOverlay = (event: ReactPointerEvent<HTMLElement>) => {
    const kind = getDragKindFromPoint(event.clientX, event.clientY, event.currentTarget, rect);
    if (!kind || disabled) return;
    event.preventDefault();
    event.stopPropagation();

    const state: PointerState = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRect: rect,
      previewWidth: event.currentTarget.clientWidth,
      previewHeight: event.currentTarget.clientHeight,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== state.pointerId) return;
      moveEvent.preventDefault();
      const ratio = getModeRatio(mode);
      onRectChange(updateRectFromDrag(state, moveEvent.clientX, moveEvent.clientY, ratio, pageAspect));
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== state.pointerId) return;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      onUserEdit();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const startTouchInteraction = (
    event: ReactTouchEvent<HTMLElement>,
    kind: DragKind,
    previewWidth: number,
    previewHeight: number,
  ) => {
    if (disabled) return;
    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    event.stopPropagation();

    const state: PointerState = {
      kind,
      pointerId: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      startRect: rect,
      previewWidth,
      previewHeight,
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const nextTouch = Array.from(moveEvent.touches).find((item) => item.identifier === state.pointerId);
      if (!nextTouch) return;
      moveEvent.preventDefault();
      const ratio = getModeRatio(mode);
      onRectChange(
        updateRectFromDrag(state, nextTouch.clientX, nextTouch.clientY, ratio, pageAspect),
      );
    };

    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      onUserEdit();
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
  };

  const startTouchFromOverlay = (event: ReactTouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    const kind = getDragKindFromPoint(touch.clientX, touch.clientY, event.currentTarget, rect);
    if (!kind) return;
    startTouchInteraction(event, kind, event.currentTarget.clientWidth, event.currentTarget.clientHeight);
  };

  const handleClass =
    "absolute z-20 grid h-5 w-5 touch-none place-items-center rounded-full border-2 border-white bg-cyan-500 shadow-sm";
  const edgeClass = "absolute z-20 touch-none rounded-full border border-white bg-cyan-500 shadow-sm";

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 touch-none rounded-xl"
      onPointerDownCapture={startPointerFromOverlay}
      onMouseDownCapture={startMouseFromOverlay}
      onTouchStartCapture={startTouchFromOverlay}
    >
      <div className="absolute inset-0 rounded-xl bg-slate-950/45" />
      <div
        className="absolute rounded-lg border-2 border-cyan-400 bg-transparent"
        style={{
          left: `${rect.x}%`,
          top: `${rect.y}%`,
          width: `${rect.width}%`,
          height: `${rect.height}%`,
          boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.18)",
        }}
      >
        <button
          type="button"
          aria-label="Move crop area"
          className="absolute inset-0 z-10 cursor-move touch-none bg-transparent"
        />
        {[
          ["nw", "-left-2.5 -top-2.5 cursor-nwse-resize"],
          ["ne", "-right-2.5 -top-2.5 cursor-nesw-resize"],
          ["sw", "-bottom-2.5 -left-2.5 cursor-nesw-resize"],
          ["se", "-bottom-2.5 -right-2.5 cursor-nwse-resize"],
        ].map(([kind, className]) => (
          <button
            key={kind}
            type="button"
            aria-label={`Resize crop ${kind}`}
            className={cn(handleClass, className)}
          />
        ))}
        {[
          ["n", "left-1/2 top-0 h-3 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize"],
          ["s", "bottom-0 left-1/2 h-3 w-8 -translate-x-1/2 translate-y-1/2 cursor-ns-resize"],
          ["w", "left-0 top-1/2 h-8 w-3 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
          ["e", "right-0 top-1/2 h-8 w-3 translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
        ].map(([kind, className]) => (
          <button
            key={kind}
            type="button"
            aria-label={`Resize crop ${kind}`}
            className={cn(edgeClass, className)}
          />
        ))}
      </div>
    </div>
  );
}

export function CropPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("cropped.pdf");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scope, setScope] = useState<CropScope>("all");
  const [mode, setMode] = useState<CropMode>("custom");
  const [cropRect, setCropRect] = useState<CropRect>(defaultRect);
  const [pageAspect, setPageAspect] = useState(1);

  useEffect(() => {
    const pending = consumePendingFiles(".pdf,application/pdf", false);
    if (pending?.[0]) {
      void selectFile(pending[0]);
    }
    // Pending-file bootstrapping should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => revokeObjectUrl(downloadUrl);
  }, [downloadUrl]);

  const fileSize = useMemo(() => (file ? formatFileSize(file.size) : null), [file]);
  const normalizedRect = useMemo(() => normalizeCropRect(cropRect), [cropRect]);
  const margins = useMemo(() => cropRectToMargins(normalizedRect), [normalizedRect]);

  const resetResultState = (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(nextFile));
    setStatus("idle");
    setError(null);
  };

  const trackCropEvent = (eventName: string, extra: Record<string, string | number | boolean> = {}) => {
    trackEvent(eventName, {
      ...analyticsBase,
      crop_mode: mode,
      page_scope: scope === "all" ? "all-pages" : "current-page",
      ...extra,
    });
  };

  const selectFile = async (nextFile: File | null) => {
    resetResultState(nextFile);
    setPageCount(null);
    setCurrentPage(1);
    setMode("custom");
    setCropRect(defaultRect);
    setProgressNote("Waiting for file");
    setFile(nextFile);

    if (!nextFile) return;

    try {
      const totalPages = await getPdfPageCount(nextFile);
      setPageCount(totalPages);
      setProgressNote("Adjust the crop area");
    } catch (err) {
      setFile(null);
      setStatus("error");
      setError(err instanceof Error ? err.message : "This PDF could not be read.");
      setProgressNote("Failed to read PDF");
    }
  };

  const setRectFromUser = (nextRect: CropRect) => {
    resetResultState(file);
    setCropRect(normalizeCropRect(nextRect));
  };

  const applyMode = (nextMode: CropMode) => {
    resetResultState(file);
    setMode(nextMode);

    const preset = cropModes.find((item) => item.id === nextMode);
    if (preset?.rect) {
      setCropRect(preset.rect);
      return;
    }

    if (preset?.ratio) {
      setCropRect((current) => fitRatioRect(preset.ratio, pageAspect, current));
    }
  };

  const updateMargin = (key: keyof typeof margins, value: number) => {
    setMode("custom");
    setRectFromUser(cropMarginsToRect({ ...margins, [key]: clamp(value, 0, 95) }));
  };

  const handleSubmit = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    try {
      validateCropRect(normalizedRect);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Crop area is invalid.");
      setProgressNote("Adjust the crop area");
      trackCropEvent("conversion_error", {
        error_type: "invalid_crop_area",
        error_message_short: "Crop area is invalid",
      });
      return;
    }

    try {
      trackCropEvent("conversion_started");
      setStatus("processing");
      setError(null);
      setProgressNote(scope === "all" ? "Cropping every page..." : `Cropping page ${currentPage}...`);

      const bytes = await cropPdf(file, { cropRect: normalizedRect, scope, currentPage });
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setProgressNote("Your cropped PDF is ready.");
      trackCropEvent("conversion_success");
      setStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Crop PDF failed. Please try again.";
      setError(message);
      setStatus("error");
      setProgressNote("Crop failed.");
      trackCropEvent("conversion_error", {
        error_type: "processing_failure",
        error_message_short: message.slice(0, 96),
      });
    }
  };

  const canGoPrevious = currentPage > 1 && status !== "processing";
  const canGoNext = pageCount != null && currentPage < pageCount && status !== "processing";

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
          void selectFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "group relative block cursor-pointer rounded-3xl border border-border bg-card p-8 text-center shadow-card transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 sm:p-12",
          drag && "scale-[1.01] border-primary",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(event) => {
            void selectFile(event.target.files?.[0] ?? null);
          }}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft transition-transform group-hover:scale-105">
          <Upload className="h-7 w-7" />
        </div>
        <p className="responsive-file-name mx-auto text-lg font-medium" title={file?.name}>
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one PDF, adjust the crop box directly, and download a trimmed copy.
        </p>
      </label>

      {file && (
        <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="responsive-file-name text-sm font-medium" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fileSize}
                  {pageCount != null ? ` | ${pageCount} pages` : ""}
                </div>
              </div>
            </div>
            {status !== "processing" && (
              <button
                type="button"
                onClick={() => void selectFile(null)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {file && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
          <div className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-base font-semibold">Crop editor</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Drag the box to move it, or pull a handle to resize.
                </div>
              </div>
              {pageCount != null && pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={!canGoPrevious}
                    aria-label="Previous page"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-20 text-center text-xs font-medium text-muted-foreground">
                    {currentPage} / {pageCount}
                  </div>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(pageCount ?? page, page + 1))
                    }
                    disabled={!canGoNext}
                    aria-label="Next page"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <PdfPagePreview
              file={file}
              pageNumber={currentPage}
              title="Page preview"
              note={`${roundPercent(normalizedRect.width)}% width x ${roundPercent(normalizedRect.height)}% height kept`}
              className="mt-0 border border-border/70 bg-background shadow-none"
              onPageCountChange={setPageCount}
              overlay={(renderSize) => (
                <CropOverlay
                  rect={normalizedRect}
                  mode={mode}
                  disabled={status === "processing"}
                  onRectChange={setRectFromUser}
                  onUserEdit={() => {
                    resetResultState(file);
                    if (!getModeRatio(mode) && mode !== "custom") setMode("custom");
                  }}
                  pageAspect={renderSize.width / renderSize.height}
                  onPageAspectChange={setPageAspect}
                />
              )}
            />
          </div>

          <aside className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Crop settings</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Presets lock ratios; Custom resizes freely.
                </div>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                <Crop className="h-4 w-4" />
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["current", "all"] as CropScope[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    resetResultState(file);
                    setScope(option);
                  }}
                  disabled={status === "processing"}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium transition-[background-color,border-color,color] duration-200",
                    scope === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/60",
                  )}
                >
                  {option === "current" ? "Current page" : "All pages"}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {cropModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyMode(item.id)}
                  disabled={status === "processing"}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-[background-color,border-color,color] duration-200 disabled:pointer-events-none disabled:opacity-60",
                    mode === item.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberControl
                label="Left"
                value={margins.left}
                disabled={status === "processing"}
                onChange={(value) => updateMargin("left", value)}
              />
              <NumberControl
                label="Top"
                value={margins.top}
                disabled={status === "processing"}
                onChange={(value) => updateMargin("top", value)}
              />
              <NumberControl
                label="Right"
                value={margins.right}
                disabled={status === "processing"}
                onChange={(value) => updateMargin("right", value)}
              />
              <NumberControl
                label="Bottom"
                value={margins.bottom}
                disabled={status === "processing"}
                onChange={(value) => updateMargin("bottom", value)}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-background p-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Width kept</div>
                <div className="font-semibold">{roundPercent(normalizedRect.width)}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Height kept</div>
                <div className="font-semibold">{roundPercent(normalizedRect.height)}%</div>
              </div>
            </div>

            <div className="mt-5">
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={status === "processing"}
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Cropping
                  </>
                ) : (
                  <>
                    Crop PDF <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {status === "processing" && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
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
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="font-semibold">Crop complete</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your cropped PDF is ready to download.
          </p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-background p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Scope</span>
              <span className="font-medium text-foreground">
                {scope === "all" ? "All pages" : `Page ${currentPage}`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Mode</span>
              <span className="font-medium text-foreground">
                {cropModes.find((item) => item.id === mode)?.label ?? "Custom"}
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName} title={downloadName}>
                <Download className="h-4 w-4" /> Download Cropped PDF
              </a>
            </Button>
            <Button variant="glass" size="lg" onClick={() => void selectFile(null)}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {!file && status !== "error" && (
        <div className="mt-6 flex justify-center">
          <Button variant="hero" size="xl" onClick={() => inputRef.current?.click()}>
            <Upload className="h-5 w-5" /> Choose PDF
          </Button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Client-side only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Crop className="h-3.5 w-3.5 text-primary" /> Drag and resize
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Fast PDF crop
        </span>
      </div>
    </>
  );
}
