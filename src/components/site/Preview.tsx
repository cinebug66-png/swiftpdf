import { Combine, Download, FileText, FileType2, Minimize2, Scissors } from "lucide-react";

export function Preview() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-60" />
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
            Tool preview
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            A delightful PDF toolkit in your browser
          </h2>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute -inset-6 bg-gradient-primary opacity-20 blur-3xl rounded-[40px]" />
          <div className="relative glass rounded-3xl shadow-glow border overflow-hidden">
            {/* window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
              <div className="ml-3 text-xs text-muted-foreground">SwiftPDF — annual-report.pdf</div>
            </div>
            <div className="grid grid-cols-12 min-h-[420px]">
              {/* sidebar */}
              <div className="col-span-2 border-r border-border p-3 hidden sm:block">
                {[FileType2, Combine, Minimize2, Scissors].map((Icon, i) => (
                  <button
                    key={i}
                    className={`w-full aspect-square rounded-xl grid place-items-center mb-2 ${
                      i === 0 ? "bg-gradient-primary text-primary-foreground shadow-soft" : "hover:bg-accent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              {/* canvas */}
              <div className="col-span-12 sm:col-span-7 p-6 bg-muted/40">
                <div className="aspect-[3/4] mx-auto max-w-[280px] bg-card rounded-lg shadow-card p-5 text-[10px] leading-relaxed">
                  <div className="h-2 w-1/3 bg-foreground/80 rounded mb-3" />
                  <div className="h-1.5 w-full bg-muted-foreground/30 rounded mb-1.5" />
                  <div className="h-1.5 w-11/12 bg-muted-foreground/30 rounded mb-1.5" />
                  <div className="h-1.5 w-10/12 bg-muted-foreground/30 rounded mb-3" />
                  <div className="h-16 w-full bg-gradient-primary/20 rounded mb-3" />
                  <div className="h-1.5 w-full bg-muted-foreground/30 rounded mb-1.5" />
                  <div className="h-1.5 w-9/12 bg-muted-foreground/30 rounded mb-1.5" />
                  <div className="h-1.5 w-11/12 bg-muted-foreground/30 rounded mb-3" />
                  <div className="inline-block px-2 py-0.5 rounded bg-primary/15 text-[8px] text-primary">ready</div>
                </div>
              </div>
              {/* right panel */}
              <div className="col-span-12 sm:col-span-3 border-t sm:border-t-0 sm:border-l border-border p-4">
                <div className="text-xs font-semibold mb-3">Document</div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Pages</span><span className="text-foreground">12</span></div>
                  <div className="flex justify-between"><span>Size</span><span className="text-foreground">1.4 MB</span></div>
                  <div className="flex justify-between"><span>Type</span><span className="text-foreground">PDF 1.7</span></div>
                </div>
                <div className="mt-4 rounded-xl bg-gradient-primary text-primary-foreground p-3 text-xs flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Saved</span>
                  <Download className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
