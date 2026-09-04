import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-600 text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 focus-visible:ring-brand-500",
        accent:
          "bg-gold-400 text-black shadow-md shadow-gold-400/30 hover:bg-gold-300 focus-visible:ring-gold-400",
        outline:
          "border border-cream/30 text-cream hover:bg-cream/10 focus-visible:ring-cream/40",
        ghost:
          "border border-border-subtle bg-surface text-foreground hover:border-gold-400 hover:text-gold-500 focus-visible:ring-gold-400",
      },
      size: {
        default: "px-7 py-3.5 text-base",
        sm: "px-5 py-2.5 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

interface ButtonLinkProps
  extends ComponentPropsWithoutRef<"a">,
    VariantProps<typeof buttonVariants> {
  href: string;
}

export function ButtonLink({
  className,
  variant,
  size,
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
