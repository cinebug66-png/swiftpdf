import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImagePlus,
  Loader2,
  PenLine,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  createPdfDownloadUrl,
  getPdfPageInfo,
  revokeObjectUrl,
  signPdf,
  type PdfPageInfo,
  type SignaturePlacement,
  type SignatureSourceType,
} from "@/lib/pdf-sign";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ToolStatus = "idle" | "loading" | "rendering" | "processing" | "done" | "error";
type SignatureMethod = "draw" | "upload" | "type";
type InteractionMode = "drag" | "resize";

type PageRenderSize = {
  width: number;
  height: number;
};

type InteractionState = {
  mode: InteractionMode;
  id: string;
  startClientX: number;
  startClientY: number;
  startPlacement: SignaturePlacement;
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

const DEFAULT_SIGNATURE_RATIO = 3;
const DEFAULT_TYPED_FONT_SIZE = 42;
const TYPED_PREVIEW_FONT_SIZE = 32;
const TYPED_SIGNATURE_RATIO = 900 / 260;
const HELVETICA_ITALIC_FONT = "Helvetica, Arial, sans-serif";

const SIGNATURE_FONTS = [
  {
    label: "Great Vibes style",
    value: '"Great Vibes", "Brush Script MT", "Segoe Script", cursive',
  },
  {
    label: "Pacifico style",
    value: 'Pacifico, "Brush Script MT", "Segoe Script", cursive',
  },
  {
    label: "Dancing Script style",
    value: '"Dancing Script", "Segoe Script", "Brush Script MT", cursive',
  },
  {
    label: "Caveat style",
    value: 'Caveat, "Comic Sans MS", "Segoe Print", cursive',
  },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Helvetica Italic", value: HELVETICA_ITALIC_FONT },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getDownloadName(_file: File | null) {
  return "signed.pdf";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Signature image could not be read."));
    reader.readAsDataURL(file);
  });
}

function canvasHasInk(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return false;

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 0) return true;
  }

  return false;
}

function getTypedCanvasFont(fontFamily: string, fontSize: number) {
  const style = fontFamily === HELVETICA_ITALIC_FONT ? "italic " : "";
  return `${style}${Math.round(fontSize * 2.8)}px ${fontFamily}`;
}

function typedSignatureToDataUrl(name: string, fontFamily: string, fontSize: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 260;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Typed signature could not be created.");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111827";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = getTypedCanvasFont(fontFamily, fontSize);
  context.fillText(name.trim(), canvas.width / 2, canvas.height / 2 + 4, canvas.width - 80);

  return canvas.toDataURL("image/png");
}

function makeSignatureId() {
  return `signature-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOverlayStyle(
  placement: SignaturePlacement,
  page: PdfPageInfo,
  renderSize: PageRenderSize,
) {
  return {
    left: `${(placement.x / page.width) * renderSize.width}px`,
    top: `${((page.height - placement.y - placement.height) / page.height) * renderSize.height}px`,
    width: `${(placement.width / page.width) * renderSize.width}px`,
    height: `${(placement.height / page.height) * renderSize.height}px`,
  };
}

function isPdfRenderCancelled(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "RenderingCancelledException" ||
      error.message.toLowerCase().includes("rendering cancelled"))
  );
}

export function SignPdfTool() {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfFrameRef = useRef<HTMLDivElement>(null);
  const typedPreviewBoxRef = useRef<HTMLDivElement>(null);
  const typedPreviewTextRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const interactionRef = useRef<InteractionState | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const pdfDocumentRef = useRef<PdfDocumentProxy | null>(null);
  const pdfLoadingTaskRef = useRef<PdfLoadingTask | null>(null);
  const pdfRenderTaskRef = useRef<PdfRenderTask | null>(null);
  const renderSequenceRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<PdfPageInfo[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [pdfReadyKey, setPdfReadyKey] = useState(0);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<SignatureMethod>("draw");
  const [typedName, setTypedName] = useState("");
  const [typedFontFamily, setTypedFontFamily] = useState(SIGNATURE_FONTS[0].value);
  const [typedFontSize, setTypedFontSize] = useState(DEFAULT_TYPED_FONT_SIZE);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<SignatureSourceType>("drawn");
  const [signatureRatio, setSignatureRatio] = useState(DEFAULT_SIGNATURE_RATIO);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);
  const [renderSize, setRenderSize] = useState<PageRenderSize | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTimedOut, setPreviewTimedOut] = useState(false);
  const [typedPreviewScale, setTypedPreviewScale] = useState(1);
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [activeSignatureId, setActiveSignatureId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("signed.pdf");

  const selectedPage = pageInfo[pageNumber - 1];
  const pageCount = numPages || pageInfo.length;
  const currentPageIndex = pageNumber - 1;
  const visiblePlacements = placements.filter(
    (placement) => placement.pageIndex === currentPageIndex,
  );
  const fileSize = useMemo(() => (file ? formatFileSize(file.size) : null), [file]);
  const previewPageWidth = selectedPage
    ? Math.min(pageWidth || selectedPage.width, selectedPage.width * 1.5)
    : 0;
  const canPlaceSignature = Boolean(
    file && selectedPage && signatureDataUrl && renderSize && !previewLoading && !renderError,
  );
  const typedPreviewDataUrl = useMemo(() => {
    if (!typedName.trim()) return null;

    try {
      return typedSignatureToDataUrl(typedName, typedFontFamily, TYPED_PREVIEW_FONT_SIZE);
    } catch {
      return null;
    }
  }, [typedFontFamily, typedName]);

  useEffect(() => {
    const pending = consumePendingFiles(".pdf,application/pdf", false);
    if (pending?.[0]) {
      void selectFile(pending[0]);
    }
    // Pending-file bootstrapping should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => revokeObjectUrl(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    return () => revokeObjectUrl(downloadUrl);
  }, [downloadUrl]);

  useEffect(() => {
    return () => {
      renderSequenceRef.current += 1;
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      pdfRenderTaskRef.current?.cancel();
      void pdfLoadingTaskRef.current?.destroy();
      void pdfDocumentRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (method !== "draw") return;
    setupDrawCanvas();
    window.addEventListener("resize", setupDrawCanvas);
    return () => window.removeEventListener("resize", setupDrawCanvas);
  }, [method, file]);

  useEffect(() => {
    if (method !== "type") return;

    const box = typedPreviewBoxRef.current;
    const text = typedPreviewTextRef.current;
    if (!box || !text) return;

    const updateScale = () => {
      const availableWidth = Math.max(box.clientWidth - 16, 1);
      const availableHeight = Math.max(box.clientHeight - 16, 1);
      const contentWidth = Math.max(text.scrollWidth, 1);
      const contentHeight = Math.max(text.scrollHeight, 1);
      const nextScale = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight);
      setTypedPreviewScale((current) =>
        Math.abs(current - nextScale) > 0.01 ? nextScale : current,
      );
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(box);
    observer.observe(text);

    return () => observer.disconnect();
  }, [method, typedFontFamily, typedName]);

  useEffect(() => {
    if (!signatureDataUrl) return;

    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth && image.naturalHeight) {
        setSignatureRatio(image.naturalWidth / image.naturalHeight);
      }
    };
    image.src = signatureDataUrl;
  }, [signatureDataUrl]);

  useEffect(() => {
    if (!previewUrl || !selectedPage) return;
    const frame = pdfFrameRef.current;
    if (!frame) return;

    const updatePageWidth = () => {
      setPageWidth(Math.max(280, frame.clientWidth - 32));
    };

    updatePageWidth();
    const observer = new ResizeObserver(updatePageWidth);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [previewUrl, selectedPage]);

  useEffect(() => {
    if (!pdfData) return;

    let cancelled = false;

    renderSequenceRef.current += 1;
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    pdfRenderTaskRef.current?.cancel();
    pdfRenderTaskRef.current = null;
    void pdfLoadingTaskRef.current?.destroy();
    void pdfDocumentRef.current?.destroy();
    pdfDocumentRef.current = null;

    setPreviewLoading(true);
    setPreviewTimedOut(false);
    setRenderError(null);
    setRenderSize(null);

    const loadingTask = pdfjsLib.getDocument({
      data: pdfData.slice(0),
    }) as unknown as PdfLoadingTask;
    pdfLoadingTaskRef.current = loadingTask;

    loadingTask.promise
      .then((pdfDocument) => {
        if (cancelled) return;
        pdfDocumentRef.current = pdfDocument;
        pdfLoadingTaskRef.current = null;
        setNumPages((current) =>
          current === pdfDocument.numPages ? current : pdfDocument.numPages,
        );
        setPdfReadyKey((current) => current + 1);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPreviewLoading(false);
        setRenderError(
          err instanceof Error ? err.message : "Preview failed to render. You can still export.",
        );
      });

    return () => {
      cancelled = true;
      if (pdfLoadingTaskRef.current === loadingTask) {
        void loadingTask.destroy();
        pdfLoadingTaskRef.current = null;
      }
    };
  }, [pdfData]);

  useEffect(() => {
    const pdfDocument = pdfDocumentRef.current;
    const canvas = pdfCanvasRef.current;
    if (!pdfDocument || !canvas || !selectedPage || !previewPageWidth) return;

    let cancelled = false;
    const renderId = renderSequenceRef.current + 1;
    renderSequenceRef.current = renderId;

    pdfRenderTaskRef.current?.cancel();
    pdfRenderTaskRef.current = null;

    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }

    setPreviewLoading(true);
    setPreviewTimedOut(false);
    setRenderError(null);
    setStatus((current) => (current === "processing" ? current : "rendering"));

    previewTimeoutRef.current = window.setTimeout(() => {
      if (cancelled || renderSequenceRef.current !== renderId) return;
      pdfRenderTaskRef.current?.cancel();
      pdfRenderTaskRef.current = null;
      setPreviewTimedOut(true);
      setPreviewLoading(false);
      setRenderError("Preview failed to render. You can still export.");
    }, 10000);

    const renderSelectedPage = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled || renderSequenceRef.current !== renderId) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = previewPageWidth / baseViewport.width;
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

        setRenderSize({ width: viewport.width, height: viewport.height });
        setPreviewLoading(false);
        setPreviewTimedOut(false);
        setRenderError(null);
        setStatus((current) =>
          current === "rendering" || current === "loading" ? "idle" : current,
        );
      } catch (err) {
        if (cancelled || renderSequenceRef.current !== renderId || isPdfRenderCancelled(err)) {
          return;
        }

        if (previewTimeoutRef.current) {
          window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }

        setPreviewLoading(false);
        setRenderError(
          err instanceof Error ? err.message : "Preview failed to render. You can still export.",
        );
      }
    };

    void renderSelectedPage();

    return () => {
      cancelled = true;
      if (renderSequenceRef.current === renderId) {
        pdfRenderTaskRef.current?.cancel();
        pdfRenderTaskRef.current = null;
      }
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    };
  }, [pageNumber, pdfReadyKey, previewPageWidth, selectedPage]);

  const resetResult = (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(nextFile));
    setStatus("idle");
    setError(null);
  };

  const selectFile = async (nextFile: File | null | undefined) => {
    if (!nextFile) return;

    if (nextFile.type !== "application/pdf" && !/\.pdf$/i.test(nextFile.name)) {
      setStatus("error");
      setError("Please upload a PDF file.");
      return;
    }

    resetResult(nextFile);
    revokeObjectUrl(previewUrl);
    const nextPreviewUrl = URL.createObjectURL(nextFile);
    const nextPdfData = await nextFile.arrayBuffer();
    setPreviewUrl(nextPreviewUrl);
    setFile(nextFile);
    setPdfData(nextPdfData);
    setNumPages(0);
    setPdfReadyKey(0);
    setPlacements([]);
    setActiveSignatureId(null);
    setRenderSize(null);
    setRenderError(null);
    setPreviewLoading(true);
    setPreviewTimedOut(false);
    setStatus("loading");

    try {
      const pages = await getPdfPageInfo(nextFile);
      setPageInfo(pages);
      setPageNumber(1);
      setStatus("idle");
    } catch (err) {
      setFile(null);
      setPdfData(null);
      revokeObjectUrl(nextPreviewUrl);
      setPreviewUrl(null);
      setPageInfo([]);
      setNumPages(0);
      setPdfReadyKey(0);
      setStatus("error");
      setError(err instanceof Error ? err.message : "This PDF could not be read.");
    }
  };

  const setupDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3.5;
    context.strokeStyle = "#111827";
  };

  const getDrawPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getDrawPoint(event);
    drawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;

    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    event.preventDefault();
    const point = getDrawPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    event.currentTarget.releasePointerCapture(event.pointerId);
    drawingRef.current = false;
  };

  const clearDrawing = () => {
    setupDrawCanvas();
    if (method === "draw") {
      setSignatureDataUrl(null);
    }
  };

  const saveDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !canvasHasInk(canvas)) {
      setStatus("error");
      setError("Draw your signature before saving it.");
      return;
    }

    setSignatureDataUrl(canvas.toDataURL("image/png"));
    setSignatureType("drawn");
    setStatus("idle");
    setError(null);
  };

  const uploadSignature = async (uploadedFile: File | null | undefined) => {
    if (!uploadedFile) return;

    if (
      uploadedFile.type !== "image/png" &&
      uploadedFile.type !== "image/jpeg" &&
      !/\.(png|jpe?g)$/i.test(uploadedFile.name)
    ) {
      setStatus("error");
      setError("Upload a PNG or JPG signature image.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(uploadedFile);
      setSignatureDataUrl(dataUrl);
      setSignatureType("image");
      setStatus("idle");
      setError(null);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Signature image could not be loaded.");
    }
  };

  const saveTypedSignature = () => {
    if (!typedName.trim()) {
      setStatus("error");
      setError("Type your name before creating the signature.");
      return;
    }

    try {
      setSignatureDataUrl(typedSignatureToDataUrl(typedName, typedFontFamily, typedFontSize));
      setSignatureType("typed");
      setStatus("idle");
      setError(null);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Typed signature could not be created.");
    }
  };

  const updateTypedSignatureDraft = (text: string, fontFamily: string, fontSize: number) => {
    if (signatureType !== "typed" || !signatureDataUrl || !text.trim()) return;

    try {
      setSignatureDataUrl(typedSignatureToDataUrl(text, fontFamily, fontSize));
    } catch {
      // Keep the last valid typed signature available for placement.
    }
  };

  const createPlacement = (
    pdfX: number,
    pdfY: number,
    sourceDataUrl = signatureDataUrl,
    sourceType = signatureType,
  ) => {
    if (!file || !selectedPage || !renderSize || !sourceDataUrl) return;

    const placementRatio = sourceType === "typed" ? TYPED_SIGNATURE_RATIO : signatureRatio;
    const defaultWidth = selectedPage.width * 0.28;
    const defaultHeight = defaultWidth / placementRatio;
    const nextPlacement: SignaturePlacement = {
      id: makeSignatureId(),
      pageIndex: currentPageIndex,
      x: clamp(pdfX, 0, selectedPage.width - defaultWidth),
      y: clamp(pdfY, 0, selectedPage.height - defaultHeight),
      width: defaultWidth,
      height: defaultHeight,
      rotation: 0,
      scale: 1,
      opacity: 1,
      type: sourceType,
      signatureData: sourceDataUrl,
      imageData: sourceDataUrl,
      text: sourceType === "typed" ? typedName.trim() : undefined,
      fontFamily: sourceType === "typed" ? typedFontFamily : undefined,
      fontSize: sourceType === "typed" ? typedFontSize : undefined,
    };

    setPlacements((current) => [...current, nextPlacement]);
    setActiveSignatureId(nextPlacement.id ?? null);
    setStatus("idle");
    setError(null);
  };

  const addSignatureToPdf = () => {
    if (!canPlaceSignature || !selectedPage) {
      setStatus("error");
      setError("Upload a PDF and create a signature before adding it.");
      return;
    }

    const activeRatio = signatureType === "typed" ? TYPED_SIGNATURE_RATIO : signatureRatio;
    const defaultWidth = selectedPage.width * 0.28;
    const defaultHeight = defaultWidth / activeRatio;
    createPlacement(
      selectedPage.width / 2 - defaultWidth / 2,
      selectedPage.height / 2 - defaultHeight / 2,
    );
  };

  const beginInteraction = (
    event: React.PointerEvent<HTMLDivElement>,
    placement: SignaturePlacement,
    mode: InteractionMode,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveSignatureId(placement.id ?? null);
    if (placement.type === "typed") {
      setMethod("type");
      setTypedName(placement.text ?? "");
      setTypedFontFamily(placement.fontFamily ?? SIGNATURE_FONTS[0].value);
      setTypedFontSize(placement.fontSize ?? DEFAULT_TYPED_FONT_SIZE);
    }
    interactionRef.current = {
      mode,
      id: placement.id ?? "",
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPlacement: placement,
    };
  };

  const updateInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || !selectedPage || !renderSize) return;

    event.preventDefault();
    const deltaPdfX =
      ((event.clientX - interaction.startClientX) / renderSize.width) * selectedPage.width;
    const deltaPdfY =
      ((event.clientY - interaction.startClientY) / renderSize.height) * selectedPage.height;

    setPlacements((current) =>
      current.map((placement) => {
        if (placement.id !== interaction.id) return placement;

        if (interaction.mode === "drag") {
          return {
            ...placement,
            x: clamp(
              interaction.startPlacement.x + deltaPdfX,
              0,
              selectedPage.width - interaction.startPlacement.width,
            ),
            y: clamp(
              interaction.startPlacement.y - deltaPdfY,
              0,
              selectedPage.height - interaction.startPlacement.height,
            ),
          };
        }

        const resizeRatio =
          interaction.startPlacement.width / Math.max(interaction.startPlacement.height, 1);
        const top = interaction.startPlacement.y + interaction.startPlacement.height;
        const nextWidth = clamp(
          interaction.startPlacement.width + deltaPdfX,
          36,
          selectedPage.width - interaction.startPlacement.x,
        );
        const nextHeight = clamp(nextWidth / resizeRatio, 18, top);

        return {
          ...placement,
          width: nextWidth,
          height: nextHeight,
          y: top - nextHeight,
          fontSize:
            placement.type === "typed" && placement.fontSize
              ? Math.max(10, (placement.fontSize * nextHeight) / interaction.startPlacement.height)
              : placement.fontSize,
        };
      }),
    );
  };

  const endInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactionRef.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    interactionRef.current = null;
  };

  const deleteSignature = (id: string | undefined) => {
    if (!id) return;
    interactionRef.current = null;
    setPlacements((current) => current.filter((placement) => placement.id !== id));
    setActiveSignatureId((current) => (current === id ? null : current));
  };

  const updateActiveTypedPlacement = (updates: Partial<SignaturePlacement>) => {
    if (!activeSignatureId) return;

    setPlacements((current) =>
      current.map((placement) => {
        if (placement.id !== activeSignatureId || placement.type !== "typed") return placement;

        const nextText = updates.text ?? placement.text ?? "";
        const nextFontFamily = updates.fontFamily ?? placement.fontFamily ?? typedFontFamily;
        const nextFontSize = updates.fontSize ?? placement.fontSize ?? typedFontSize;
        const nextSignatureData = typedSignatureToDataUrl(nextText, nextFontFamily, nextFontSize);

        return {
          ...placement,
          ...updates,
          signatureData: nextSignatureData,
          imageData: nextSignatureData,
        };
      }),
    );
  };

  const validate = () => {
    if (!file) return "Upload a PDF before applying a signature.";
    if (!placements.length) return "Create a signature and add it to the PDF preview.";

    for (const placement of placements) {
      const page = pageInfo[placement.pageIndex];
      if (!page) return "A signature is placed on a page that does not exist.";
      if (placement.width <= 0 || placement.height <= 0) return "Signature size must be positive.";
      if (placement.x < 0 || placement.y < 0) return "A signature is outside the page.";
      if (
        placement.x + placement.width > page.width ||
        placement.y + placement.height > page.height
      ) {
        return "A signature extends beyond the page edge.";
      }
    }

    return null;
  };

  const applySignature = async () => {
    const validationError = validate();
    if (validationError) {
      setStatus("error");
      setError(validationError);
      return;
    }

    if (!file) return;

    try {
      setStatus("processing");
      setError(null);
      const bytes = await signPdf(file, placements);
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Signing failed. Please try again.");
    }
  };

  const goToPage = (nextPage: number) => {
    setPageNumber(clamp(nextPage, 1, pageCount || 1));
    setActiveSignatureId(null);
  };

  return (
    <div className="space-y-6">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void selectFile(event.dataTransfer.files?.[0]);
        }}
        className="group block cursor-pointer rounded-3xl glass p-8 text-center shadow-card transition-all duration-300 hover:shadow-glow sm:p-10"
      >
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(event) => void selectFile(event.target.files?.[0])}
        />
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-105">
          {status === "loading" ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>
        <div className="text-lg font-semibold">{file ? file.name : "Upload PDF"}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {file
            ? `${fileSize} ${pageInfo.length ? `| ${pageInfo.length} pages` : ""}`
            : "Drop a PDF here or click to browse"}
        </div>
      </label>

      {file && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl glass p-4 shadow-card sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                PDF preview
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => goToPage(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-24 rounded-2xl bg-card/70 px-3 py-2 text-center text-xs font-medium shadow-soft">
                  {pageNumber} / {pageCount || 1}
                </div>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => goToPage(pageNumber + 1)}
                  disabled={pageNumber >= pageCount}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {signatureDataUrl && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                <PenLine className="h-4 w-4 shrink-0" />
                Click Add to PDF, then drag to move or use the corner to resize.
              </div>
            )}

            <div
              ref={pdfFrameRef}
              className="relative grid min-h-[560px] place-items-start overflow-auto rounded-2xl border border-border bg-muted/50 p-4 shadow-soft"
            >
              {(previewLoading || (status === "loading" && !renderSize)) && !renderError && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-card/70 text-sm text-muted-foreground backdrop-blur-sm">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rendering preview
                  </span>
                </div>
              )}

              {renderError ? (
                <div className="grid h-[360px] w-full place-items-center text-sm text-muted-foreground">
                  {renderError}
                </div>
              ) : (
                <div
                  className={cn("relative mx-auto bg-white shadow-card")}
                  style={
                    selectedPage && previewPageWidth
                      ? {
                          width: previewPageWidth,
                          minHeight: (previewPageWidth / selectedPage.width) * selectedPage.height,
                        }
                      : { width: 360, minHeight: 480 }
                  }
                >
                  <canvas ref={pdfCanvasRef} className="block" />
                  {renderSize &&
                    selectedPage &&
                    visiblePlacements.map((placement) => {
                      const isActive = placement.id === activeSignatureId;
                      return (
                        <div
                          key={placement.id}
                          data-signature-overlay
                          className={cn(
                            "absolute z-20 select-none rounded-md border bg-white/10",
                            isActive
                              ? "border-primary shadow-glow"
                              : "border-primary/50 shadow-soft",
                          )}
                          style={getOverlayStyle(placement, selectedPage, renderSize)}
                          onPointerDown={(event) => beginInteraction(event, placement, "drag")}
                          onPointerMove={updateInteraction}
                          onPointerUp={endInteraction}
                          onPointerCancel={endInteraction}
                        >
                          <img
                            src={placement.signatureData}
                            alt="Placed signature"
                            draggable={false}
                            className="h-full w-full object-fill"
                          />
                          {isActive && (
                            <>
                              <button
                                type="button"
                                aria-label="Delete signature"
                                onPointerDown={(event) => {
                                  event.stopPropagation();
                                }}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  deleteSignature(placement.id);
                                }}
                                className="pointer-events-auto absolute -right-3 -top-3 z-30 grid h-7 w-7 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-soft"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <div
                                role="button"
                                tabIndex={0}
                                aria-label="Resize signature"
                                className="absolute -bottom-2 -right-2 h-5 w-5 cursor-se-resize rounded-full border-2 border-white bg-primary shadow-soft"
                                onPointerDown={(event) =>
                                  beginInteraction(event, placement, "resize")
                                }
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl glass p-5 shadow-card">
              <div className="mb-4 text-sm font-semibold">Signature</div>
              <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-card/70 p-1 shadow-soft">
                {[
                  { id: "draw", label: "Draw", icon: PenLine },
                  { id: "upload", label: "Upload", icon: ImagePlus },
                  { id: "type", label: "Type", icon: Type },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMethod(item.id as SignatureMethod);
                      setStatus("idle");
                      setError(null);
                    }}
                    className={cn(
                      "flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all",
                      method === item.id
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>

              {method === "draw" && (
                <div className="space-y-3">
                  <canvas
                    ref={drawCanvasRef}
                    className="h-40 w-full touch-none rounded-2xl border border-border bg-white shadow-soft"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="glass" size="lg" onClick={clearDrawing}>
                      <X className="h-4 w-4" /> Clear
                    </Button>
                    <Button variant="hero" size="lg" onClick={saveDrawing}>
                      Save Drawing
                    </Button>
                  </div>
                </div>
              )}

              {method === "upload" && (
                <div className="space-y-3">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    className="sr-only"
                    onChange={(event) => {
                      void uploadSignature(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="grid min-h-32 w-full place-items-center rounded-2xl border border-dashed border-primary/30 bg-card/70 px-4 text-center text-sm font-medium transition-all hover:border-primary/70"
                  >
                    <span>
                      <ImagePlus className="mx-auto mb-2 h-5 w-5 text-primary" />
                      Upload PNG or JPG
                    </span>
                  </button>
                </div>
              )}

              {method === "type" && (
                <div className="space-y-3">
                  <input
                    value={typedName}
                    onChange={(event) => {
                      const nextText = event.target.value;
                      setTypedName(nextText);
                      updateTypedSignatureDraft(nextText, typedFontFamily, typedFontSize);
                      updateActiveTypedPlacement({ text: nextText.trim() });
                    }}
                    placeholder="Type your signature"
                    className="h-11 w-full rounded-2xl border border-border bg-card/70 px-4 text-sm outline-none transition-shadow focus:shadow-glow"
                  />
                  <Select
                    value={typedFontFamily}
                    onValueChange={(value) => {
                      setTypedFontFamily(value);
                      updateTypedSignatureDraft(typedName, value, typedFontSize);
                      updateActiveTypedPlacement({ fontFamily: value });
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-border bg-card/70 px-4 shadow-none">
                      <SelectValue placeholder="Choose font" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNATURE_FONTS.map((font) => (
                        <SelectItem key={font.label} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="block space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Size</span>
                    <input
                      type="range"
                      min={24}
                      max={76}
                      value={typedFontSize}
                      onChange={(event) => {
                        const nextSize = Number(event.target.value);
                        setTypedFontSize(nextSize);
                        updateTypedSignatureDraft(typedName, typedFontFamily, nextSize);
                        updateActiveTypedPlacement({ fontSize: nextSize });
                      }}
                      className="w-full accent-primary"
                    />
                  </label>
                  <div
                    ref={typedPreviewBoxRef}
                    className="grid h-24 w-full place-items-center overflow-hidden rounded-2xl bg-white p-4 text-center text-[#111827] shadow-soft"
                  >
                    <div
                      ref={typedPreviewTextRef}
                      className="inline-block max-w-none origin-center whitespace-nowrap leading-none"
                      style={{
                        fontFamily: typedFontFamily,
                        fontSize: TYPED_PREVIEW_FONT_SIZE,
                        fontStyle: typedFontFamily === HELVETICA_ITALIC_FONT ? "italic" : undefined,
                        transform: `scale(${typedPreviewScale})`,
                      }}
                    >
                      {typedName.trim() || "Type your signature"}
                    </div>
                  </div>
                  <Button variant="hero" size="lg" className="w-full" onClick={saveTypedSignature}>
                    Create Signature
                  </Button>
                </div>
              )}

              {(signatureDataUrl || (method === "type" && typedPreviewDataUrl)) && (
                <div className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    Spelling & style preview
                  </div>
                  <div
                    aria-label="Signature preview"
                    className="upload-signature-preview"
                    role="img"
                    style={{
                      backgroundImage: `url("${
                        method === "type"
                          ? (typedPreviewDataUrl ?? signatureDataUrl ?? "")
                          : (signatureDataUrl ?? "")
                      }")`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="rounded-3xl glass p-5 shadow-card">
              <div className="mb-4 text-sm font-semibold">Placement</div>
              <div className="rounded-2xl bg-card/70 p-4 text-sm text-muted-foreground shadow-soft">
                {signatureDataUrl
                  ? "Add the signature to the selected page, then drag and resize it on the preview."
                  : "Create a signature first, then add it to the selected page."}
              </div>
              {signatureDataUrl && (
                <Button
                  variant="glass"
                  size="lg"
                  className="mt-3 w-full"
                  onClick={addSignatureToPdf}
                >
                  Add to PDF
                </Button>
              )}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-card/70 p-3 shadow-soft">
                  <div className="text-xs font-medium text-muted-foreground">Selected page</div>
                  <div className="mt-1 text-sm font-semibold">{pageNumber}</div>
                </div>
                <div className="rounded-2xl bg-card/70 p-3 shadow-soft">
                  <div className="text-xs font-medium text-muted-foreground">Placed</div>
                  <div className="mt-1 text-sm font-semibold">{placements.length}</div>
                </div>
              </div>
            </div>

            {status === "error" && error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive shadow-soft">
                {error}
              </div>
            )}

            {status === "done" && downloadUrl && (
              <div className="rounded-3xl glass p-5 text-center shadow-glow">
                <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="font-semibold">Signed PDF ready</div>
                <Button variant="hero" size="lg" className="mt-4 w-full" asChild>
                  <a href={downloadUrl} download={downloadName}>
                    <Download className="h-4 w-4" /> Download Signed PDF
                  </a>
                </Button>
              </div>
            )}

            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={applySignature}
              disabled={status === "processing"}
            >
              {status === "processing" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PenLine className="h-5 w-5" />
              )}
              Export Signed PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
