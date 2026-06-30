import { Upload, Wand2, Download } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload File", desc: "Drag & drop or click to upload your PDF." },
  { icon: Wand2, title: "Convert or Edit", desc: "Pick a tool — we'll handle the heavy lifting." },
  { icon: Download, title: "Download Instantly", desc: "Get your file in seconds, ready to share." },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-16">
          <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
            How it works
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Three steps. That's it.
          </h2>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto relative w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow">
                <s.icon className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-card border border-border text-xs font-semibold grid place-items-center text-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-semibold tracking-tight text-lg">{s.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
