import {
  Component,
  type CSSProperties,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type PageRenderSize = {
  width: number;
  height: number;
  scale: number;
};

type PdfRenderTask = {
  cancel: () => void;
  promise: Promise<unknown>;
};

type PdfPageProxy = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => PdfRenderTask;
};

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  destroy: () => Promise<void>;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocumentProxy>;
  destroy: () => Promise<void>;
};

function getMaxPreviewHeight() {
  if (typeof window === "undefined") return 500;
  if (window.matchMedia("(max-width: 640px)").matches) return 300;
  if (window.matchMedia("(max-width: 1024px)").matches) return 400;
  return 500;
}

type PdfPagePreviewProps = {
  file: File | null;
  pageNumber?: number;
  title: string;
  note?: string;
  className?: string;
  visualRotation?: number;
  overlay?: (renderSize: PageRenderSize) => ReactNode;
  onPageCountChange?: (pageCount: number) => void;
};

type PdfPagePreviewBoundaryProps = PdfPagePreviewProps;

type PdfPagePreviewBoundaryState = {
  error: Error | null;
};

function getPreviewErrorMessage(error?: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Preview failed to render. You can still export.";
}

function PreviewFallback({
  className,
  title,
  note,
  message = "Preview failed to render. You can still export.",
}: {
  className?: string;
  title: string;
  note?: string;
  message?: string;
}) {
  return (
    <div className={cn("mt-6 rounded-2xl glass p-5 shadow-card", className)}>
      <div className="mb-3 text-sm font-medium">{title}</div>
      <div className="grid min-h-40 place-items-center rounded-2xl bg-card/70 p-4 text-center text-sm text-muted-foreground shadow-soft">
        {message}
      </div>
      {note && <div className="mt-3 text-xs text-muted-foreground">{note}</div>}
    </div>
  );
}

class PdfPagePreviewBoundary extends Component<
  { children: ReactNode; fallbackProps: PdfPagePreviewBoundaryProps },
  PdfPagePreviewBoundaryState
> {
  state: PdfPagePreviewBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PdfPagePreviewBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PDF preview crashed", error, errorInfo);
  }

  componentDidUpdate(previousProps: {
    children: ReactNode;
    fallbackProps: PdfPagePreviewBoundaryProps;
  }) {
    if (previousProps.fallbackProps.file !== this.props.fallbackProps.file && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <PreviewFallback
          className={this.props.fallbackProps.className}
          title={this.props.fallbackProps.title}
          note={this.props.fallbackProps.note}
          message={getPreviewErrorMessage(this.state.error)}
        />
      );
    }

    return this.props.children;
  }
}

function isReadableFile(file: File | null): file is File {
  return Boolean(
    file &&
    typeof file.name === "string" &&
    typeof file.size === "number" &&
    typeof file.arrayBuffer === "function",
  );
}

function isPdfRenderCancelled(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "RenderingCancelledException" ||
      error.message.toLowerCase().includes("rendering cancelled"))
  );
}

function PdfPagePreviewInner({
  file,
  pageNumber = 1,
  title,
  note,
  className,
  visualRotation = 0,
  overlay,
  onPageCountChange,
}: PdfPagePreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocumentRef = useRef<PdfDocumentProxy | null>(null);
  const pdfLoadingTaskRef = useRef<PdfLoadingTask | null>(null);
  const pdfRenderTaskRef = useRef<PdfRenderTask | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const renderSequenceRef = useRef(0);
  const onPageCountChangeRef = useRef(onPageCountChange);

  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [readyKey, setReadyKey] = useState(0);
  const [frameWidth, setFrameWidth] = useState(0);
  const [maxPreviewHeight, setMaxPreviewHeight] = useState(getMaxPreviewHeight);
  const [renderSize, setRenderSize] = useState<PageRenderSize | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedRotation = ((visualRotation % 360) + 360) % 360;
  const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;

  useEffect(() => {
    onPageCountChangeRef.current = onPageCountChange;
  }, [onPageCountChange]);

  useEffect(() => {
    return () => {
      renderSequenceRef.current += 1;
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      try {
        pdfRenderTaskRef.current?.cancel();
      } catch {
        // Ignore preview cleanup failures so the tool can keep working.
      }
      void pdfLoadingTaskRef.current?.destroy().catch(() => undefined);
      void pdfDocumentRef.current?.destroy().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateFrameWidth = () => {
      setFrameWidth(Math.max(180, frame.clientWidth - 32));
    };

    updateFrameWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateFrameWidth);
      return () => window.removeEventListener("resize", updateFrameWidth);
    }

    const observer = new ResizeObserver(updateFrameWidth);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [file]);

  useEffect(() => {
    const updateMaxPreviewHeight = () => setMaxPreviewHeight(getMaxPreviewHeight());

    updateMaxPreviewHeight();
    window.addEventListener("resize", updateMaxPreviewHeight);
    return () => window.removeEventListener("resize", updateMaxPreviewHeight);
  }, []);

  useEffect(() => {
    let cancelled = false;

    renderSequenceRef.current += 1;
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    try {
      pdfRenderTaskRef.current?.cancel();
    } catch {
      // Ignore preview cleanup failures so the tool can keep working.
    }
    pdfRenderTaskRef.current = null;
    void pdfLoadingTaskRef.current?.destroy().catch(() => undefined);
    void pdfDocumentRef.current?.destroy().catch(() => undefined);
    pdfDocumentRef.current = null;
    setPdfData(null);
    setPageCount(0);
    setRenderSize(null);
    setError(null);

    if (!file) {
      setLoading(false);
      return;
    }

    if (!isReadableFile(file)) {
      setLoading(false);
      setError("Preview is unavailable for this file. You can still export.");
      return;
    }

    setLoading(true);
    file
      .arrayBuffer()
      .then((data) => {
        if (!cancelled) {
          setPdfData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Preview failed to render. You can still export.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!pdfData) return;

    let cancelled = false;
    let loadingTask: PdfLoadingTask;
    try {
      loadingTask = pdfjsLib.getDocument({
        data: pdfData.slice(0),
      }) as unknown as PdfLoadingTask;
    } catch (err) {
      setLoading(false);
      setError(getPreviewErrorMessage(err));
      return;
    }
    pdfLoadingTaskRef.current = loadingTask;

    loadingTask.promise
      .then((pdfDocument) => {
        if (cancelled) return;
        pdfDocumentRef.current = pdfDocument;
        pdfLoadingTaskRef.current = null;
        setPageCount(pdfDocument.numPages);
        onPageCountChangeRef.current?.(pdfDocument.numPages);
        setReadyKey((current) => current + 1);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoading(false);
        setError(getPreviewErrorMessage(err));
      });

    return () => {
      cancelled = true;
      if (pdfLoadingTaskRef.current === loadingTask) {
        void loadingTask.destroy().catch(() => undefined);
        pdfLoadingTaskRef.current = null;
      }
    };
  }, [pdfData]);

  useEffect(() => {
    const pdfDocument = pdfDocumentRef.current;
    const canvas = canvasRef.current;
    if (!pdfDocument || !canvas || !frameWidth) return;

    let cancelled = false;
    const renderId = renderSequenceRef.current + 1;
    renderSequenceRef.current = renderId;
    const safePageNumber = Math.min(Math.max(pageNumber, 1), pdfDocument.numPages);

    try {
      pdfRenderTaskRef.current?.cancel();
    } catch {
      // Ignore preview cleanup failures so the tool can keep working.
    }
    pdfRenderTaskRef.current = null;

    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }

    setLoading(true);
    setError(null);

    previewTimeoutRef.current = window.setTimeout(() => {
      if (cancelled || renderSequenceRef.current !== renderId) return;
      try {
        pdfRenderTaskRef.current?.cancel();
      } catch {
        // Ignore preview cleanup failures so the tool can keep working.
      }
      pdfRenderTaskRef.current = null;
      setLoading(false);
      setError("Preview failed to render. You can still export.");
    }, 10000);

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(safePageNumber);
        if (cancelled || renderSequenceRef.current !== renderId) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const displayHeightForCap = isQuarterTurn ? baseViewport.width : baseViewport.height;
        const scale =
          Math.min(frameWidth / baseViewport.width, maxPreviewHeight / displayHeightForCap, 1.5) ||
          1;
        const viewport = page.getViewport({ scale });
        const pixelRatio = window.devicePixelRatio || 1;
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Preview failed to render. You can still export.");
        }

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);

        const renderTask = page.render({ canvasContext: context, viewport });
        pdfRenderTaskRef.current = renderTask;
        await renderTask.promise;

        if (cancelled || renderSequenceRef.current !== renderId) return;

        if (previewTimeoutRef.current) {
          window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        if (pdfRenderTaskRef.current === renderTask) {
          pdfRenderTaskRef.current = null;
        }

        setRenderSize({ width: viewport.width, height: viewport.height, scale });
        setLoading(false);
        setError(null);
      } catch (err) {
        if (cancelled || renderSequenceRef.current !== renderId || isPdfRenderCancelled(err)) {
          return;
        }

        if (previewTimeoutRef.current) {
          window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }

        setLoading(false);
        setError(getPreviewErrorMessage(err));
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      if (renderSequenceRef.current === renderId) {
        try {
          pdfRenderTaskRef.current?.cancel();
        } catch {
          // Ignore preview cleanup failures so the tool can keep working.
        }
        pdfRenderTaskRef.current = null;
      }
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    };
  }, [pageNumber, readyKey, frameWidth, maxPreviewHeight, isQuarterTurn]);

  const previewWidth = renderSize ? (isQuarterTurn ? renderSize.height : renderSize.width) : 0;
  const previewHeight = renderSize
    ? Math.min(isQuarterTurn ? renderSize.width : renderSize.height, maxPreviewHeight)
    : Math.min(260, maxPreviewHeight);
  const innerStyle: CSSProperties | undefined = renderSize
    ? {
        width: renderSize.width,
        height: renderSize.height,
        transform: `translate(-50%, -50%) rotate(${visualRotation}deg)`,
      }
    : undefined;

  return (
    <div className={cn("mt-6 rounded-2xl glass p-5 shadow-card", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">{title}</div>
        {pageCount > 0 && (
          <div className="text-xs text-muted-foreground">
            Page {Math.min(Math.max(pageNumber, 1), pageCount)} of {pageCount}
          </div>
        )}
      </div>
      <div ref={frameRef} className="overflow-x-auto rounded-2xl bg-card/70 p-4 shadow-soft">
        <div
          className="relative mx-auto grid place-items-center"
          style={{
            width: previewWidth || "100%",
            maxWidth: "100%",
            height: previewHeight,
          }}
        >
          {loading && (
            <div className="absolute inset-0 z-20 grid place-items-center rounded-xl bg-background/70 text-sm text-muted-foreground backdrop-blur-sm">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Rendering preview
              </span>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-20 grid place-items-center rounded-xl bg-destructive/10 p-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="absolute left-1/2 top-1/2 origin-center" style={innerStyle}>
            <canvas className="block rounded-xl bg-white shadow-soft" ref={canvasRef} />
            {renderSize && overlay?.(renderSize)}
          </div>
        </div>
      </div>
      {note && <div className="mt-3 text-xs text-muted-foreground">{note}</div>}
    </div>
  );
}

export function PdfPagePreview(props: PdfPagePreviewProps) {
  if (!props.file) return null;

  return (
    <PdfPagePreviewBoundary fallbackProps={props}>
      <PdfPagePreviewInner {...props} />
    </PdfPagePreviewBoundary>
  );
}
