import { createFileRoute, redirect } from "@tanstack/react-router";
import { getToolPath } from "@/lib/tool-routes";
import { getTool } from "@/lib/tools";

export const Route = createFileRoute("/tools/$slug")({
  beforeLoad: ({ params }) => {
    const tool = getTool(params.slug);
    throw redirect({ to: tool ? getToolPath(tool.slug) : "/" });
  },
  component: LegacyToolRoute,
});

function LegacyToolRoute() {
  return null;
}
