"use client";
import { createContext, useContext } from "react";

// Navigation is abstracted so the shared UI doesn't depend on next/* (which the
// extension's Vite build can't resolve). Each target supplies an implementation:
// web wires it to next/navigation, the extension to a hash router.
export interface Nav {
  /** Navigate to a logical path like "/" or "/models/123". */
  navigate: (path: string) => void;
  /** Map a logical path to a real href (identity on web, "#"+path in the extension). */
  resolveHref: (path: string) => string;
}

const NavCtx = createContext<Nav>({
  navigate: () => {},
  resolveHref: (p) => p,
});

export function NavProvider({ value, children }: { value: Nav; children: React.ReactNode }) {
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

export function useNav(): Nav {
  return useContext(NavCtx);
}

/** Drop-in replacement for next/link, routing through the injected Nav. */
export function NavLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { navigate, resolveHref } = useNav();
  return (
    <a
      href={resolveHref(href)}
      className={className}
      onClick={(e) => {
        // Let modified clicks / non-primary buttons open normally (new tab, etc.).
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
