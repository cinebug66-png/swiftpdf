import { useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { RouterProvider, useNavigate, usePathname } from "@/lib/app-router";
import { getTool } from "@/lib/tools";
import { getToolPath } from "@/lib/tool-routes";
import HomePage from "@/pages/home-page";
import PdfToWordPage from "@/pages/pdf-to-word-page";
import CompressPdfPage from "@/pages/compress-pdf-page";
import MergePdfPage from "@/pages/merge-pdf-page";
import WordToPdfPage from "@/pages/word-to-pdf-page";
import SplitPdfPage from "@/pages/split-pdf-page";
import JpgToPdfPage from "@/pages/jpg-to-pdf-page";
import WatermarkPdfPage from "@/pages/watermark-pdf-page";

function AppRoutes() {
  const pathname = usePathname();
  const navigate = useNavigate();

  useEffect(() => {
    if (!pathname.startsWith("/tools/")) return;

    const slug = pathname.replace(/^\/tools\//, "");
    if (slug === "split-pdf") {
      navigate("/split-pdf", { replace: true });
      return;
    }

    const tool = getTool(slug);
    navigate(tool ? getToolPath(tool.slug) : "/", { replace: true });
  }, [navigate, pathname]);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "SwiftPDF",
      "/pdf-to-word": "PDF to Word - SwiftPDF",
      "/compress-pdf": "Compress PDF - SwiftPDF",
      "/merge-pdf": "Merge PDF - SwiftPDF",
      "/split-pdf": "Split PDF - SwiftPDF",
      "/jpg-to-pdf": "JPG to PDF - SwiftPDF",
      "/word-to-pdf": "Word to PDF - SwiftPDF",
      "/watermark-pdf": "Watermark PDF - SwiftPDF",
    };

    document.title = titles[pathname] ?? "SwiftPDF";
  }, [pathname]);

  switch (pathname) {
    case "/":
      return <HomePage />;
    case "/pdf-to-word":
      return <PdfToWordPage />;
    case "/compress-pdf":
      return <CompressPdfPage />;
    case "/merge-pdf":
      return <MergePdfPage />;
    case "/split-pdf":
      return <SplitPdfPage />;
    case "/jpg-to-pdf":
      return <JpgToPdfPage />;
    case "/word-to-pdf":
      return <WordToPdfPage />;
    case "/watermark-pdf":
      return <WatermarkPdfPage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AppRoutes />
      </RouterProvider>
    </ThemeProvider>
  );
}
