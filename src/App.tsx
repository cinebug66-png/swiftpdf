import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
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
import RotatePdfPage from "@/pages/rotate-pdf-page";
import DeletePagesPage from "@/pages/delete-pages-page";
import ProtectPdfPage from "@/pages/protect-pdf-page";
import UnlockPdfPage from "@/pages/unlock-pdf-page";
import SignPdfPage from "@/pages/sign-pdf-page";
import AboutPage from "@/pages/about-page";
import ContactPage from "@/pages/contact-page";
import PrivacyPolicyPage from "@/pages/privacy-policy-page";
import TermsPage from "@/pages/terms-page";

type RouteErrorBoundaryProps = {
  children: ReactNode;
  routeKey: string;
};

type RouteErrorBoundaryState = {
  error: Error | null;
};

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SwiftPDF tool crashed", error, errorInfo);
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (previousProps.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-gradient-mesh px-4 py-24">
          <div className="mx-auto max-w-2xl rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive shadow-soft">
            Something went wrong while loading this tool. Please remove the file and try again.
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function renderRoute(pathname: string) {
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
    case "/rotate-pdf":
      return <RotatePdfPage />;
    case "/delete-pages":
      return <DeletePagesPage />;
    case "/protect-pdf":
      return <ProtectPdfPage />;
    case "/unlock-pdf":
      return <UnlockPdfPage />;
    case "/sign-pdf":
      return <SignPdfPage />;
    case "/about":
      return <AboutPage />;
    case "/contact":
      return <ContactPage />;
    case "/privacy-policy":
      return <PrivacyPolicyPage />;
    case "/terms":
      return <TermsPage />;
    default:
      return <HomePage />;
  }
}

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
      "/rotate-pdf": "Rotate PDF - SwiftPDF",
      "/delete-pages": "Delete PDF Pages - SwiftPDF",
      "/protect-pdf": "Protect PDF - SwiftPDF",
      "/unlock-pdf": "Unlock PDF - SwiftPDF",
      "/sign-pdf": "Sign PDF - SwiftPDF",
      "/about": "About - SwiftPDF",
      "/contact": "Contact - SwiftPDF",
      "/privacy-policy": "Privacy Policy - SwiftPDF",
      "/terms": "Terms of Service - SwiftPDF",
    };

    document.title = titles[pathname] ?? "SwiftPDF";
  }, [pathname]);

  return <RouteErrorBoundary routeKey={pathname}>{renderRoute(pathname)}</RouteErrorBoundary>;
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
