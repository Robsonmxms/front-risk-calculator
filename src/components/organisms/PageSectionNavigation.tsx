"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export type PageSectionLink = {
  href: string;
  label: string;
};

export function PageSectionNavigation({
  links,
  label = "Seções da página",
  className
}: {
  links: PageSectionLink[];
  label?: string;
  className?: string;
}) {
  const firstHref = links[0]?.href ?? "#";
  const [activeHref, setActiveHref] = useState(firstHref);

  useEffect(() => {
    const updateFromHash = () => setActiveHref(window.location.hash || firstHref);
    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, [firstHref]);

  return (
    <div className={cn("rounded-lg border border-border bg-card p-2 shadow-sm", className)}>
      <p className="px-2 pb-1 text-xs text-muted-foreground sm:hidden">
        Deslize para acessar todas as seções.
      </p>
      <nav
        aria-label={label}
        className="overflow-x-auto rounded-md focus-within:ring-2 focus-within:ring-moss/25"
      >
        <div className="flex min-w-max gap-1 md:min-w-0 md:flex-wrap">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeHref === link.href ? "location" : undefined}
              onClick={() => setActiveHref(link.href)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground",
                "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/25",
                "aria-[current=location]:bg-muted aria-[current=location]:text-foreground"
              )}
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
