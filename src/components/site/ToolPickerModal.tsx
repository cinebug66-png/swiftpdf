import { Sparkles, FileText, ArrowRight, X } from "lucide-react";
import { useLayoutEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "@/lib/app-router";
import { getToolPath } from "@/lib/tool-routes";
import { tools } from "@/lib/tools";
import { suggestToolsFor } from "@/lib/pending-file";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
};

export function ToolPickerModal({ open, onOpenChange, file }: Props) {
  const navigate = useNavigate();
  const suggested = file ? suggestToolsFor(file) : [];
  const suggestedSlugs = new Set(suggested.map((t) => t.slug));
  const others = tools.filter((t) => !suggestedSlugs.has(t.slug));

  useLockedBodyScroll(open);

  const go = (slug: string) => {
    onOpenChange(false);
    const tool = tools.find((item) => item.slug === slug);
    if (!tool) return;
    navigate(getToolPath(tool.slug));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tool-picker-modal" overlayClassName="tool-picker-overlay">
        <div className="tool-picker-modal-scroll">
          <DialogHeader className="space-y-3 text-left">
            <div className="tool-picker-badge inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              File ready
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Choose what you want to do with your PDF
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Pick a tool — your file will be loaded automatically.
            </DialogDescription>
          </DialogHeader>

          {file && (
            <div className="tool-picker-file mt-5 flex items-center justify-between rounded-2xl px-4 py-3 shadow-soft animate-fade-up">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="tool-picker-file-name text-sm font-medium" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · attached
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {suggested.length > 0 && (
            <div className="mt-7">
              <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
                Suggested for this file
              </div>
              <div className="tool-picker-grid grid sm:grid-cols-3">
                {suggested.map((t, i) => (
                  <ToolCard
                    key={t.slug}
                    tool={t}
                    onClick={() => go(t.slug)}
                    delay={i * 60}
                    highlight
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-7">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              All tools
            </div>
            <div className="tool-picker-grid grid sm:grid-cols-2 lg:grid-cols-3">
              {others.map((t, i) => (
                <ToolCard key={t.slug} tool={t} onClick={() => go(t.slug)} delay={i * 30} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useLockedBodyScroll(open: boolean) {
  useLayoutEffect(() => {
    if (!open || typeof window === "undefined") return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverflow = documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);
}

function ToolCard({
  tool,
  onClick,
  delay,
  highlight,
}: {
  tool: (typeof tools)[number];
  onClick: () => void;
  delay: number;
  highlight?: boolean;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "tool-picker-card group relative rounded-2xl border p-4 text-left transition-all duration-300 animate-fade-up",
        "hover:-translate-y-1",
        highlight && "tool-picker-card-highlight",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} grid place-items-center text-white shadow-soft shrink-0 group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold tracking-tight truncate">{tool.name}</div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tool.desc}</div>
        </div>
      </div>
    </button>
  );
}
