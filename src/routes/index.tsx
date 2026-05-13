import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Tools } from "@/components/site/Tools";
import { WhyUs } from "@/components/site/WhyUs";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Preview } from "@/components/site/Preview";
import { Testimonials } from "@/components/site/Testimonials";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SwiftPDF — Convert & Edit PDFs Instantly" },
      {
        name: "description",
        content:
          "Fast, secure, and completely free PDF tools. Convert, merge, compress, and edit PDFs in seconds — no sign up required.",
      },
      { property: "og:title", content: "SwiftPDF — Convert & Edit PDFs Instantly" },
      {
        property: "og:description",
        content: "Free, secure PDF tools for students, freelancers and teams.",
      },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
        <Navbar />
        <main>
          <Hero />
          <Tools />
          <WhyUs />
          <HowItWorks />
          <Preview />
          <Testimonials />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
  );
}
