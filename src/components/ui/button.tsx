import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-moss text-white shadow-sm hover:bg-moss-strong focus-visible:ring-moss/30",
  secondary:
    "border border-border bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:ring-ring/25",
  outline:
    "border border-border bg-background text-foreground shadow-sm hover:bg-muted focus-visible:ring-ring/25",
  ghost: "text-foreground hover:bg-muted focus-visible:ring-ring/25",
  destructive:
    "bg-ember text-white shadow-sm hover:bg-ember-strong focus-visible:ring-ember/25"
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-10 w-10"
};

export function buttonVariants({
  variant = "default",
  size = "default",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      type={type}
      {...props}
    />
  );
}

export interface LinkButtonProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
  return <Link className={buttonVariants({ variant, size, className })} {...props} />;
}
