import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/app-router";
import { getToolPath } from "@/lib/tool-routes";
import { publicTools } from "@/lib/tools";

export function Tools() {
  return (
    <section id="tools" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
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

        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))] [grid-auto-rows:1fr] gap-3 sm:gap-5">
          {publicTools.map((t) => (
            <Link
              key={t.slug}
              to={getToolPath(t.slug)}
              className="group relative flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-glow sm:p-6"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} grid place-items-center text-white shadow-soft mb-4`}
              >
                <t.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 font-semibold tracking-tight">{t.name}</div>
              <div className="mt-1 min-w-0 text-sm leading-relaxed text-muted-foreground">{t.desc}</div>
              <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-1 group-hover:opacity-100 sm:right-6 sm:top-6" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
