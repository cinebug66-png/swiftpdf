import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/app-router";
import { getToolPath } from "@/lib/tool-routes";
import { tools } from "@/lib/tools";

export function Tools() {
  return (
    <section id="tools" className="py-24 sm:py-32 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
            Popular Tools
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Every PDF tool you'll ever need
          </h2>
          <p className="mt-4 text-muted-foreground">
            All the essentials in one place — beautifully fast and free to use.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {tools.map((t) => (
            <Link
              key={t.slug}
              to={getToolPath(t.slug)}
              className="group relative rounded-2xl p-6 bg-card border border-border shadow-card hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} grid place-items-center text-white shadow-soft mb-4`}
              >
                <t.icon className="w-5 h-5" />
              </div>
              <div className="font-semibold tracking-tight">{t.name}</div>
              <div className="text-sm text-muted-foreground mt-1">{t.desc}</div>
              <ArrowRight className="absolute top-6 right-6 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
