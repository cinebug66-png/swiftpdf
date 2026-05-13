import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";

type NavigateOptions = {
  replace?: boolean;
};

type RouterContextValue = {
  pathname: string;
  navigate: (to: string, options?: NavigateOptions) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

function getCurrentPathname() {
  return window.location.pathname || "/";
}

function scrollToHashIfNeeded(hash: string) {
  if (!hash) return;

  window.setTimeout(() => {
    const target = document.getElementById(hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 30);
}

function navigateToPath(to: string, options?: NavigateOptions) {
  const url = new URL(to, window.location.origin);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;

  if (options?.replace) {
    window.history.replaceState({}, "", nextUrl);
  } else {
    window.history.pushState({}, "", nextUrl);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
  scrollToHashIfNeeded(url.hash);
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(getCurrentPathname);

  useEffect(() => {
    const onPopState = () => setPathname(getCurrentPathname());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value = useMemo<RouterContextValue>(
    () => ({
      pathname,
      navigate: (to, options) => navigateToPath(to, options),
    }),
    [pathname],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouterContext() {
  const value = useContext(RouterContext);
  if (!value) {
    throw new Error("Router context is missing. Wrap the app in RouterProvider.");
  }

  return value;
}

export function usePathname() {
  return useRouterContext().pathname;
}

export function useNavigate() {
  return useRouterContext().navigate;
}

type LinkProps = {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function Link({ to, children, className, onClick }: LinkProps) {
  const navigate = useNavigate();

  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
