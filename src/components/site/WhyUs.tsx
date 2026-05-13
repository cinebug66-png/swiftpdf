import { Zap, Shield, UserX, Sparkles, Smartphone } from "lucide-react";

const items = [
  { icon: Zap, title: "Ultra fast processing", desc: "Optimized engines convert files in under 3 seconds." },
  { icon: Shield, title: "Bank-grade security", desc: "256-bit encryption. Files auto-deleted after 1 hour." },
  { icon: UserX, title: "No sign up required", desc: "Use every tool instantly — no accounts, no friction." },
  { icon: Sparkles, title: "Clean user experience", desc: "Beautifully designed for clarity and speed." },
  { icon: Smartphone, title: "Works everywhere", desc: "Mobile, tablet, desktop. Same delightful feel." },
];

export function WhyUs() {
  return (
    <section id="why" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-50" />
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
            Why SwiftPDF
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Built for speed, designed for trust
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <div
              key={it.title}
              className={`glass rounded-2xl p-7 shadow-card hover:shadow-glow transition-all duration-300 ${
                i === 4 ? "lg:col-start-2" : ""
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-soft mb-4">
                <it.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold tracking-tight">{it.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
