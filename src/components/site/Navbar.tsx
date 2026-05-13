import { useEffect, useState } from "react";
import { Moon, Sun, FileText, Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#tools", label: "Tools" },
  { href: "/#why", label: "Why us" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-300",
            scrolled ? "glass shadow-soft" : "bg-transparent",
          )}
        >
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
              <FileText className="w-4 h-4" />
            </span>
            <span className="text-lg">SwiftPDF</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="hero" className="hidden sm:inline-flex" asChild>
              <a href="/#tools">Get Started</a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </nav>

        {open && (
          <div className="md:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-foreground/80 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
