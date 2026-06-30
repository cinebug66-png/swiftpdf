import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  GripVertical,
  Loader2,
  RotateCcw,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { clearPending, peekPending } from "@/lib/pending-file";
import { createPdfDownloadUrl, reorderPdfPages, revokeObjectUrl } from "@/lib/pdf-reorder";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ToolStatus = "idle" | "loading" | "ready" | "processing" | "done" | "error";

type ReorderPage = {
  pageNumber: number;
  thumbnailUrl: string;
  width: number;
  height: number;
};

type DragPreview = {
  pageNumber: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

type DragSession = {
  pointerId: number;
  pointerType: string;
  pageNumber: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  activated: boolean;
  holdTimer: number | null;
};

type ReorderVisualItem =
  | {
      kind: "page";
      page: ReorderPage;
    }
  | {
      kind: "placeholder";
      id: string;
    };

const ACCEPTED_PDF_TYPES = ".pdf,application/pdf";
const DESKTOP_DRAG_ACTIVATION_DISTANCE = 10;
const MOBILE_DRAG_ACTIVATION_DISTANCE = 12;
const MOBILE_HOLD_DELAY = 220;
const DRAG_ANIMATION_MS = 320;
const DRAG_EASING = "cubic-bezier(0.2, 0, 0, 1)";
const PDF_OPEN_TIMEOUT_MS = 15_000;
const PDF_OPEN_ERROR_MESSAGE = "Could not open this PDF. Please upload it again.";

type PdfRenderTask = {
  cancel: () => void;
  promise: Promise<unknown>;
};

type PdfLoadingTask = ReturnType<typeof pdfjsLib.getDocument> & {
  destroy: () => Promise<void>;
};

type ActivePdfLoad = {
  loadingTask: PdfLoadingTask | null;
  renderTask: PdfRenderTask | null;
  timeoutId: number | null;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isPdfFile(file: File) {
  return (
    file instanceof File &&
    typeof file.arrayBuffer === "function" &&
    file.size > 0 &&
    (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
  );
}

function getDownloadName(file: File) {
  return `${file.name.replace(/\.pdf$/i, "")}-reordered.pdf`;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Could not create a page thumbnail."));
      },
      "image/jpeg",
      0.82,
    );
  });
}

function revokeThumbnails(pages: ReorderPage[]) {
  pages.forEach((page) => URL.revokeObjectURL(page.thumbnailUrl));
}

async function readPdfBytes(file: File) {
  if (!isPdfFile(file)) {
    throw new Error("Please choose a valid PDF file.");
  }

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error(PDF_OPEN_ERROR_MESSAGE);
  }

  return new Uint8Array(buffer.slice(0));
}

export function ReorderPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<ReorderPage[]>([]);
  const downloadUrlRef = useRef<string | null>(null);
  const loadIdRef = useRef(0);
  const activePdfLoadRef = useRef<ActivePdfLoad>({
    loadingTask: null,
    renderTask: null,
    timeoutId: null,
  });
  const draggedPageRef = useRef<number | null>(null);
  const dropIndexRef = useRef<number | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const pageCardRefs = useRef(new Map<number, HTMLElement>());
  const previousCardPositionsRef = useRef(new Map<number, DOMRect>());
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<ReorderPage[]>([]);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [dragOverUpload, setDragOverUpload] = useState(false);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressNote, setProgressNote] = useState("Waiting for PDF");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const cancelActivePdfLoad = () => {
    const activeLoad = activePdfLoadRef.current;

    if (activeLoad.timeoutId != null) {
      window.clearTimeout(activeLoad.timeoutId);
      activeLoad.timeoutId = null;
    }

    try {
      activeLoad.renderTask?.cancel();
    } catch {
      // pdf.js render tasks can already be settled when cleanup runs.
    }

    void activeLoad.loadingTask?.destroy().catch(() => undefined);
    activeLoad.renderTask = null;
    activeLoad.loadingTask = null;
  };

  useEffect(() => {
    const pendingFile = peekPending()?.find(isPdfFile);
    if (!pendingFile) return;

    const pendingLoadId = window.setTimeout(() => {
      clearPending();
      void selectFile(pendingFile);
    }, 0);

    return () => window.clearTimeout(pendingLoadId);
    // Pending files should only be bootstrapped on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    downloadUrlRef.current = downloadUrl;
  }, [downloadUrl]);

  useEffect(() => {
    return () => {
      loadIdRef.current += 1;
      cancelActivePdfLoad();
      if (dragSessionRef.current?.holdTimer != null) {
        window.clearTimeout(dragSessionRef.current.holdTimer);
      }
      window.document.documentElement.classList.remove("pdf-reorder-dragging");
      window.document.body.classList.remove("pdf-reorder-dragging");
      revokeThumbnails(pagesRef.current);
      revokeObjectUrl(downloadUrlRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    previousCardPositionsRef.current.forEach((previousRect, pageNumber) => {
      const element = pageCardRefs.current.get(pageNumber);
      if (!element || pageNumber === draggedPageRef.current) return;

      const nextRect = element.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (deltaX === 0 && deltaY === 0) return;
      element.animate(
        [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: "translate(0, 0)" }],
        { duration: DRAG_ANIMATION_MS, easing: DRAG_EASING },
      );
    });
    previousCardPositionsRef.current.clear();
  }, [draggedPage, dropIndex, pages]);

  const isOriginalOrder = useMemo(
    () => pages.every((page, index) => page.pageNumber === index + 1),
    [pages],
  );

  const visualItems = useMemo<ReorderVisualItem[]>(() => {
    if (draggedPage == null || dropIndex == null) {
      return pages.map((page) => ({ kind: "page", page }));
    }

    const remainingPages = pages.filter((page) => page.pageNumber !== draggedPage);
    const nextItems: ReorderVisualItem[] = remainingPages.map((page) => ({ kind: "page", page }));
    const insertIndex = Math.max(0, Math.min(dropIndex, remainingPages.length));
    nextItems.splice(insertIndex, 0, { kind: "placeholder", id: `placeholder-${draggedPage}` });
    return nextItems;
  }, [draggedPage, dropIndex, pages]);

  const clearOutput = () => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
  };

  const clearPages = () => {
    revokeThumbnails(pagesRef.current);
    pagesRef.current = [];
    setPages([]);
  };

  const captureCardPositions = () => {
    previousCardPositionsRef.current = new Map(
      Array.from(pageCardRefs.current, ([pageNumber, element]) => [
        pageNumber,
        element.getBoundingClientRect(),
      ]),
    );
  };

  const selectFile = async (nextFile: File | null) => {
    loadIdRef.current += 1;
    const loadId = loadIdRef.current;
    cancelActivePdfLoad();
    clearOutput();
    clearPages();
    dragSessionRef.current = null;
    draggedPageRef.current = null;
    setDraggedPage(null);
    setDragPreview(null);
    setDropIndex(null);
    setProgress(0);
    setError(null);

    if (!nextFile) {
      setFile(null);
      setStatus("idle");
      setProgressNote("Waiting for PDF");
      return;
    }

    if (!isPdfFile(nextFile)) {
      setFile(null);
      setStatus("error");
      setError("Please choose a valid PDF file.");
      setProgressNote("Invalid file type");
      return;
    }

    setFile(nextFile);
    setStatus("loading");
    setProgressNote("Opening PDF");
    trackAnalyticsEvent("reorder_pdf_started", { tool_name: "reorder_pdf" });

    const createdPages: ReorderPage[] = [];
    let pdfTimedOut = false;

    try {
      activePdfLoadRef.current.timeoutId = window.setTimeout(() => {
        if (loadIdRef.current !== loadId) return;

        pdfTimedOut = true;
        cancelActivePdfLoad();
        setStatus("error");
        setProgress(0);
        setProgressNote("Could not read PDF");
        setError(PDF_OPEN_ERROR_MESSAGE);
      }, PDF_OPEN_TIMEOUT_MS);

      const data = await readPdfBytes(nextFile);
      if (pdfTimedOut) return;
      if (loadIdRef.current !== loadId) return;
      setProgress(8);

      const loadingTask = pdfjsLib.getDocument({ data: data.slice() }) as PdfLoadingTask;
      activePdfLoadRef.current.loadingTask = loadingTask;
      const pdfDoc = await loadingTask.promise;
      if (pdfTimedOut) return;

      if (pdfDoc.numPages < 1) {
        throw new Error("This PDF does not contain any pages.");
      }

      if (activePdfLoadRef.current.timeoutId != null) {
        window.clearTimeout(activePdfLoadRef.current.timeoutId);
        activePdfLoadRef.current.timeoutId = null;
      }

      setProgressNote("Rendering pages");

      for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
        if (loadIdRef.current !== loadId) {
          revokeThumbnails(createdPages);
          return;
        }

        const pdfPage = await pdfDoc.getPage(pageNumber);
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(220 / baseViewport.width, 280 / baseViewport.height);
        const viewport = pdfPage.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = window.document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) throw new Error("Your browser could not render PDF thumbnails.");

        canvas.width = Math.ceil(viewport.width * pixelRatio);
        canvas.height = Math.ceil(viewport.height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, viewport.width, viewport.height);

        try {
          const renderTask = pdfPage.render({
            canvas,
            canvasContext: context,
            viewport,
          }) as PdfRenderTask;
          activePdfLoadRef.current.renderTask = renderTask;
          await renderTask.promise;
          activePdfLoadRef.current.renderTask = null;
          const thumbnail = await canvasToBlob(canvas);
          createdPages.push({
            pageNumber,
            thumbnailUrl: URL.createObjectURL(thumbnail),
            width: Math.round(viewport.width),
            height: Math.round(viewport.height),
          });
        } finally {
          canvas.width = 0;
          canvas.height = 0;
          pdfPage.cleanup();
        }

        const nextProgress = Math.round((pageNumber / pdfDoc.numPages) * 100);
        setProgress(nextProgress);
        setProgressNote(`Rendering pages (${pageNumber} of ${pdfDoc.numPages})`);
      }

      if (loadIdRef.current !== loadId) {
        revokeThumbnails(createdPages);
        return;
      }

      pagesRef.current = createdPages;
      setPages(createdPages);
      setProgress(100);
      setProgressNote("Ready");
      setStatus("ready");
    } catch (loadError) {
      revokeThumbnails(createdPages);
      if (loadIdRef.current !== loadId) return;
      if (pdfTimedOut) return;

      const message = loadError instanceof Error ? loadError.message.toLowerCase() : "";
      setFile(null);
      setStatus("error");
      setProgress(0);
      setProgressNote("Could not read PDF");
      setError(
        message === PDF_OPEN_ERROR_MESSAGE.toLowerCase()
          ? PDF_OPEN_ERROR_MESSAGE
          : message.includes("please choose")
            ? "Please choose a valid PDF file."
            : message.includes("password")
              ? "Password-protected PDFs are not supported. Unlock the PDF first."
              : message.includes("canvas")
                ? "Your browser could not render this PDF. Please try a modern browser."
                : "This file is not a valid PDF or may be corrupted.",
      );
    } finally {
      if (activePdfLoadRef.current.timeoutId != null) {
        window.clearTimeout(activePdfLoadRef.current.timeoutId);
        activePdfLoadRef.current.timeoutId = null;
      }

      if (loadIdRef.current === loadId) {
        activePdfLoadRef.current.renderTask = null;
        await activePdfLoadRef.current.loadingTask?.destroy().catch(() => undefined);
        activePdfLoadRef.current.loadingTask = null;
      }
    }
  };

  const resetOrder = () => {
    clearOutput();
    captureCardPositions();
    setPages((currentPages) =>
      [...currentPages].sort((left, right) => left.pageNumber - right.pageNumber),
    );
    setStatus("ready");
    setError(null);
    setProgressNote("Original page order restored");
  };

  const setDragLock = (locked: boolean) => {
    window.document.documentElement.classList.toggle("pdf-reorder-dragging", locked);
    window.document.body.classList.toggle("pdf-reorder-dragging", locked);
  };

  const activatePageDrag = (session: DragSession, clientX: number, clientY: number) => {
    if (session.activated || dragSessionRef.current !== session) return;

    session.activated = true;
    if (session.holdTimer != null) {
      window.clearTimeout(session.holdTimer);
      session.holdTimer = null;
    }

    clearOutput();
    captureCardPositions();
    draggedPageRef.current = session.pageNumber;
    setDraggedPage(session.pageNumber);
    const sourceIndex = pagesRef.current.findIndex(
      (page) => page.pageNumber === session.pageNumber,
    );
    dropIndexRef.current = sourceIndex;
    setDropIndex(sourceIndex);
    setDragPreview({
      pageNumber: session.pageNumber,
      left: clientX - session.offsetX,
      top: clientY - session.offsetY,
      width: session.width,
      height: session.height,
    });
    setDragLock(true);
    setStatus("ready");
    setProgressNote("Release to place the page at the blue marker");
  };

  const beginPageDrag = (event: ReactPointerEvent<HTMLElement>, pageNumber: number) => {
    if (status === "loading" || status === "processing") return;

    const card = pageCardRefs.current.get(pageNumber);
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const session: DragSession = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      pageNumber,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      activated: false,
      holdTimer: null,
    };

    dragSessionRef.current = session;
    event.currentTarget.setPointerCapture(event.pointerId);

    if (event.pointerType !== "mouse") {
      session.holdTimer = window.setTimeout(() => {
        activatePageDrag(session, session.startX, session.startY);
      }, MOBILE_HOLD_DELAY);
    }
  };

  const moveDraggedPage = (event: ReactPointerEvent<HTMLElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const distance = Math.hypot(event.clientX - session.startX, event.clientY - session.startY);

    if (!session.activated) {
      const activationDistance =
        session.pointerType === "mouse"
          ? DESKTOP_DRAG_ACTIVATION_DISTANCE
          : MOBILE_DRAG_ACTIVATION_DISTANCE;

      if (session.pointerType === "mouse" && distance >= activationDistance) {
        activatePageDrag(session, event.clientX, event.clientY);
      } else if (session.pointerType !== "mouse" && distance >= activationDistance) {
        if (session.holdTimer != null) window.clearTimeout(session.holdTimer);
        session.holdTimer = null;
        dragSessionRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }
      return;
    }

    event.preventDefault();
    setDragPreview((currentPreview) =>
      currentPreview
        ? {
            ...currentPreview,
            left: event.clientX - session.offsetX,
            top: event.clientY - session.offsetY,
          }
        : currentPreview,
    );

    const target = window.document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-reorder-page]");
    const targetPage = Number(target?.dataset.reorderPage);

    if (!target || !Number.isInteger(targetPage) || targetPage === session.pageNumber) return;

    const targetRect = target.getBoundingClientRect();
    const targetIndex = pagesRef.current.findIndex((page) => page.pageNumber === targetPage);
    const sourceIndex = pagesRef.current.findIndex(
      (page) => page.pageNumber === session.pageNumber,
    );
    const placeAfter =
      window.innerWidth < 640
        ? event.clientY > targetRect.top + targetRect.height / 2
        : event.clientX > targetRect.left + targetRect.width / 2;
    let nextDropIndex = targetIndex + (placeAfter ? 1 : 0);

    if (nextDropIndex > sourceIndex) nextDropIndex -= 1;
    nextDropIndex = Math.max(0, Math.min(nextDropIndex, pagesRef.current.length - 1));
    if (dropIndexRef.current === nextDropIndex) return;

    captureCardPositions();
    dropIndexRef.current = nextDropIndex;
    setDropIndex(nextDropIndex);
  };

  const finishPageDrag = (event: ReactPointerEvent<HTMLElement>, commit: boolean) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    if (session.holdTimer != null) window.clearTimeout(session.holdTimer);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const finalDropIndex = dropIndexRef.current;
    if (commit && session.activated && finalDropIndex != null) {
      event.preventDefault();
      captureCardPositions();
      setPages((currentPages) => {
        const sourceIndex = currentPages.findIndex(
          (page) => page.pageNumber === session.pageNumber,
        );
        if (sourceIndex < 0 || sourceIndex === finalDropIndex) return currentPages;

        const nextPages = [...currentPages];
        const [movedPage] = nextPages.splice(sourceIndex, 1);
        nextPages.splice(finalDropIndex, 0, movedPage);
        return nextPages;
      });
    }

    dragSessionRef.current = null;
    draggedPageRef.current = null;
    dropIndexRef.current = null;
    setDraggedPage(null);
    setDragPreview(null);
    setDropIndex(null);
    setDragLock(false);
    setProgressNote("Drag pages to reorder");
  };

  const endPageDrag = (event: ReactPointerEvent<HTMLElement>) => {
    finishPageDrag(event, true);
  };

  const cancelPageDrag = (event: ReactPointerEvent<HTMLElement>) => {
    finishPageDrag(event, false);
  };

  const downloadReorderedPdf = async () => {
    if (!file || pages.length === 0 || status !== "ready") return;

    setStatus("processing");
    setError(null);
    setProgressNote("Creating your reordered PDF...");

    try {
      const bytes = await reorderPdfPages(
        file,
        pages.map((page) => page.pageNumber),
      );
      const nextDownloadUrl = createPdfDownloadUrl(bytes);
      clearOutput();
      setDownloadUrl(nextDownloadUrl);
      setStatus("done");
      setProgressNote("Your reordered PDF is ready");
      trackAnalyticsEvent("reorder_pdf_completed", {
        tool_name: "reorder_pdf",
        page_count: String(pages.length),
      });

      const anchor = window.document.createElement("a");
      anchor.href = nextDownloadUrl;
      anchor.download = getDownloadName(file);
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      trackAnalyticsEvent("reorder_pdf_download", {
        tool_name: "reorder_pdf",
        page_count: String(pages.length),
      });
    } catch (reorderError) {
      setStatus("error");
      setProgressNote("Reordering failed");
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : "Could not reorder this PDF. Please try again.",
      );
    }
  };

  return (
    <div className="min-w-0">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragOverUpload(true);
        }}
        onDragLeave={() => setDragOverUpload(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOverUpload(false);
          void selectFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "group relative block cursor-pointer rounded-3xl p-10 text-center transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 sm:p-16",
          "glass shadow-card hover:shadow-glow",
          dragOverUpload && "scale-[1.01] ring-2 ring-primary",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_PDF_TYPES}
          className="sr-only"
          onChange={(event) => {
            void selectFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="responsive-file-name mx-auto text-lg font-medium" title={file?.name}>
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one PDF and rearrange every page privately in your browser.
        </p>
      </label>

      {file && (
        <div className="mt-5 rounded-2xl glass p-4 shadow-soft">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="responsive-file-name text-sm font-medium" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {pages.length > 0 ? ` · ${pages.length} pages` : ""}
                </div>
              </div>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => void selectFile(null)}
              disabled={status === "loading" || status === "processing"}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {progressNote}
            </span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {pages.length > 0 && (
        <div className="mt-6 rounded-3xl glass p-4 shadow-card sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Drag pages to reorder</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Use the grip handle to move a page. The displayed order becomes the downloaded PDF.
              </p>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {pages.length} pages
            </div>
          </div>

          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            onPointerMove={moveDraggedPage}
            onPointerUp={endPageDrag}
            onPointerCancel={cancelPageDrag}
          >
            {visualItems.map((item, index) => {
              if (item.kind === "placeholder") {
                return (
                  <div
                    key={item.id}
                    data-reorder-placeholder="true"
                    aria-hidden="true"
                    className="min-h-36 rounded-2xl border-2 border-dashed border-primary/45 bg-primary/10 shadow-soft transition-[border-color,box-shadow,opacity,transform] duration-300 ease-out sm:min-h-80"
                  />
                );
              }

              const { page } = item;

              return (
                <article
                  key={page.pageNumber}
                  data-reorder-page={page.pageNumber}
                  ref={(element) => {
                    if (element) {
                      pageCardRefs.current.set(page.pageNumber, element);
                    } else {
                      pageCardRefs.current.delete(page.pageNumber);
                    }
                  }}
                  onPointerDown={(event) => {
                    if (
                      event.pointerType === "mouse" &&
                      !(event.target as Element).closest("button")
                    ) {
                      beginPageDrag(event, page.pageNumber);
                    }
                  }}
                  onPointerMove={moveDraggedPage}
                  onPointerUp={endPageDrag}
                  onPointerCancel={cancelPageDrag}
                  className={cn(
                    "group relative flex min-w-0 select-none items-center gap-3 rounded-2xl border bg-card p-3 shadow-soft transition-[border-color,box-shadow,opacity,transform] duration-300 ease-out sm:block sm:cursor-grab sm:active:cursor-grabbing",
                    draggedPage === page.pageNumber
                      ? "border-primary/50 bg-primary/5 opacity-45 shadow-glow"
                      : "border-border hover:-translate-y-0.5 hover:border-primary/40",
                  )}
                >
                  <div className="relative flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50 sm:h-52 sm:w-full">
                    <img
                      src={page.thumbnailUrl}
                      alt={`PDF page ${page.pageNumber}`}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-1 text-[10px] font-semibold shadow-soft backdrop-blur">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:mt-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">Page {page.pageNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        Position {index + 1} · {page.width} × {page.height}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Drag page ${page.pageNumber}`}
                      title={`Drag page ${page.pageNumber}`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        beginPageDrag(event, page.pageNumber);
                      }}
                      onPointerMove={(event) => {
                        event.stopPropagation();
                        moveDraggedPage(event);
                      }}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        endPageDrag(event);
                      }}
                      onPointerCancel={(event) => {
                        event.stopPropagation();
                        cancelPageDrag(event);
                      }}
                      className="grid h-11 w-11 shrink-0 touch-none place-items-center rounded-xl border border-border bg-background/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary active:cursor-grabbing"
                    >
                      <GripVertical className="h-5 w-5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {dragPreview && draggedPage != null && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] overflow-hidden rounded-2xl border-2 border-primary bg-card p-3 opacity-90 shadow-glow"
          style={{
            left: dragPreview.left,
            top: dragPreview.top,
            width: dragPreview.width,
            height: dragPreview.height,
            transform: "rotate(1.5deg) scale(1.03)",
            transition: `left 90ms ${DRAG_EASING}, top 90ms ${DRAG_EASING}, box-shadow ${DRAG_ANIMATION_MS}ms ease-out, transform ${DRAG_ANIMATION_MS}ms ease-out`,
          }}
        >
          <div className="relative flex h-[calc(100%-3rem)] items-center justify-center overflow-hidden rounded-xl bg-muted/50">
            <img
              src={pages.find((page) => page.pageNumber === dragPreview.pageNumber)?.thumbnailUrl}
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-sm font-semibold">
            <span>Page {dragPreview.pageNumber}</span>
            <GripVertical className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}

      {status === "processing" && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {progressNote}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full animate-pulse bg-gradient-primary" />
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive shadow-soft">
          {error}
        </div>
      )}

      {status === "done" && downloadUrl && (
        <div className="mt-6 rounded-2xl glass p-5 text-center shadow-glow">
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
          <div className="mt-2 font-semibold">Reordered PDF downloaded</div>
          <p className="mt-1 text-sm text-muted-foreground">Your original PDF remains unchanged.</p>
          <Button variant="glass" size="sm" className="mt-4" asChild>
            <a href={downloadUrl} download={file ? getDownloadName(file) : "reordered.pdf"}>
              <Download className="h-4 w-4" /> Download again
            </a>
          </Button>
        </div>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button
          variant="glass"
          size="lg"
          onClick={resetOrder}
          disabled={pages.length === 0 || isOriginalOrder || status === "processing"}
        >
          <RotateCcw className="h-4 w-4" /> Reset order
        </Button>
        <Button
          variant="hero"
          size="lg"
          onClick={() => void downloadReorderedPdf()}
          disabled={!file || pages.length === 0 || status !== "ready"}
        >
          {status === "processing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download reordered PDF
        </Button>
        <Button
          variant="glass"
          size="lg"
          onClick={() => void selectFile(null)}
          disabled={!file || status === "loading" || status === "processing"}
        >
          Clear
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Browser-based only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 text-primary" /> Touch-friendly sorting
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Original page quality
        </span>
      </div>
    </div>
  );
}
