import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Is SwiftPDF really free?", a: "Yes — every core tool is free with no watermarks, no signup, and no daily limits." },
  { q: "Are my files safe?", a: "Files are encrypted in transit and at rest, and automatically deleted after 1 hour." },
  { q: "Do I need to install anything?", a: "No. SwiftPDF runs entirely in your browser on any device." },
  { q: "What file size can I upload?", a: "Up to 100 MB per file on the free plan. Need more? Get in touch." },
  { q: "Does it work on mobile?", a: "Absolutely. SwiftPDF is fully responsive and feels native on phones and tablets." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center sm:mb-12">
          <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">FAQ</div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="rounded-2xl glass px-4 shadow-card sm:px-6">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i-${i}`} className="border-b last:border-0">
              <AccordionTrigger className="text-left text-base font-medium py-5">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
