import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Link } from "@/lib/app-router";
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
        "fixed top-0 inset-x-0 z-50 transition-[padding] duration-200",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            "flex min-w-0 items-center justify-between rounded-2xl px-4 py-3 transition-[background-color,border-color,box-shadow] duration-200 sm:px-6",
            scrolled ? "glass shadow-soft" : "bg-transparent",
          )}
        >
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight"
              aria-label="SwiftPDF home"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-transparent">
                <img
                  src="/brand/swiftpdf-icon.png"
                  alt=""
                  className="block h-9 w-9 object-contain"
                  width="36"
                  height="36"
                />
              </span>
              <span className="text-lg leading-none">SwiftPDF</span>
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

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="hero" className="hidden sm:inline-flex" asChild>
              <Link to="/#tools">Get Started</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={(event) => {
                event.currentTarget.blur();
                setOpen(!open);
              }}
              aria-label="Menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </nav>

        {open && (
          <div className="site-mobile-menu md:hidden mt-2 rounded-2xl p-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
