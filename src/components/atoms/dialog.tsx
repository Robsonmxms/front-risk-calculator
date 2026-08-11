"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = forwardRef<HTMLDivElement, DialogPrimitive.DialogContentProps>(
  function DialogContent({ className, children, ...props }, ref) {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-stone-950/45 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl",
            "focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
            className
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            className={cn(
              "absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-md text-xl leading-none text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/25"
            )}
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  }
);

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogPrimitive.DialogTitleProps>(
  function DialogTitle({ className, ...props }, ref) {
    return (
      <DialogPrimitive.Title
        ref={ref}
        className={cn("text-xl font-semibold tracking-tight text-foreground", className)}
        {...props}
      />
    );
  }
);

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  DialogPrimitive.DialogDescriptionProps
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("mt-1 text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
});

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
