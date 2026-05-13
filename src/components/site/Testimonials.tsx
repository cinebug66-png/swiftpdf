import { Star } from "lucide-react";

const items = [
  {
    quote: "SwiftPDF replaced three tools in our workflow. The conversion quality is unreal.",
    name: "Amelia Chen",
    role: "Product Designer, Linear",
  },
  {
    quote: "I shipped a 40-page proposal in minutes. The interface gets out of your way.",
    name: "Marcus Hill",
    role: "Freelance Consultant",
  },
  {
    quote: "Finally a PDF tool that doesn't feel like 2010. Fast, clean, and just works.",
    name: "Priya Raman",
    role: "Operations Lead, Notion",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Loved by teams</div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">From students to small businesses</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((t) => (
            <figure
              key={t.name}
              className="glass rounded-2xl p-7 shadow-card hover:shadow-glow transition-all duration-300"
            >
              <div className="flex gap-0.5 text-primary mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-foreground/90 leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
