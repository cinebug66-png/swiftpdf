import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 sm:p-16 text-center shadow-glow">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-primary-foreground">
              Start using SwiftPDF today
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
              Convert, compress, edit, and merge — everything you need, in one place.
            </p>
            <div className="mt-8">
              <Button
                size="xl"
                className="bg-white text-primary hover:bg-white/90 shadow-soft"
                asChild
              >
                <a href="#upload"><Upload className="w-5 h-5" /> Upload PDF</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
