import type { ReactNode } from "react";

/** Responsive page skeleton; authentication remains owned by feature containers. */
export function ProtectedPageTemplate({
  header,
  navigation,
  children
}: {
  header: ReactNode;
  navigation?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid w-full max-w-[1600px] gap-4 px-4 py-4 sm:px-6 lg:px-8">
      {header}
      {navigation}
      {children}
    </main>
  );
}
