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

export default function HomePage() {
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
