import { ArrowRight, FileText, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "@/lib/app-router";
import { getToolPath } from "@/lib/tool-routes";
import { suggestToolsFor } from "@/lib/pending-file";
import { tools } from "@/lib/tools";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
};

export function ToolPickerModal({ open, onOpenChange, file }: Props) {
  const navigate = useNavigate();
  const suggested = file ? suggestToolsFor(file) : [];
  const suggestedSlugs = new Set(suggested.map((tool) => tool.slug));
  const others = tools.filter((tool) => !suggestedSlugs.has(tool.slug));

  useLockedBodyScroll(open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;

  const close = () => onOpenChange(false);

  const go = (slug: string) => {
    close();
    const tool = tools.find((item) => item.slug === slug);
    if (tool) {
      navigate(getToolPath(tool.slug));
    }
  };

  return (
    <div
      className="mobile-tools-overlay tool-picker-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <section
        aria-modal="true"
        aria-labelledby="mobile-tools-title"
        className="mobile-tools-panel tool-picker-modal"
        role="dialog"
      >
        <div className="mobile-tools-header">
          <div>
            <div className="mobile-tools-eyebrow">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              File ready
            </div>
            <h2 id="mobile-tools-title" className="mobile-tools-title">
              Choose a PDF tool
            </h2>
            <p className="mobile-tools-description">Your file will be loaded automatically.</p>
            {file && (
              <div className="mobile-tools-file">
                <div className="mobile-tools-file-icon">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mobile-tools-file-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="mobile-tools-file-meta">
                    {(file.size / 1024 / 1024).toFixed(2)} MB attached
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            aria-label="Close tools menu"
            className="mobile-tools-close"
            type="button"
            onClick={(event) => {
              event.currentTarget.blur();
              close();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mobile-tools-body">
          {suggested.length > 0 && (
            <ToolGroup title="Suggested for this file" featured>
              {suggested.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} onClick={() => go(tool.slug)} highlight />
              ))}
            </ToolGroup>
          )}

          <ToolGroup title="All tools">
            {others.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} onClick={() => go(tool.slug)} />
            ))}
          </ToolGroup>
        </div>
      </section>
    </div>
  );
}

function useLockedBodyScroll(open: boolean) {
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);
}

function ToolGroup({
  title,
  children,
  featured,
}: {
  title: string;
  children: ReactNode;
  featured?: boolean;
}) {
  return (
    <div className="mobile-tools-group">
      <div className="mobile-tools-group-title">{title}</div>
      <nav aria-label={title} className={cn("mobile-tools-list", featured && "mobile-tools-list-featured")}>
        {children}
      </nav>
    </div>
  );
}

function ToolCard({
  tool,
  onClick,
  highlight,
}: {
  tool: (typeof tools)[number];
  onClick: () => void;
  highlight?: boolean;
}) {
  const Icon = tool.icon;

  return (
    <button
      className={cn("mobile-tool-card", highlight && "mobile-tool-card-highlight")}
      type="button"
      onClick={(event) => {
        event.currentTarget.blur();
        onClick();
      }}
    >
      <span className={cn("mobile-tool-card-icon bg-gradient-to-br", tool.color)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="mobile-tool-card-title">{tool.name}</span>
        <span className="mobile-tool-card-description">{tool.desc}</span>
      </span>
      <ArrowRight className="mobile-tool-card-arrow" />
    </button>
  );
}
