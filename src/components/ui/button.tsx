import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Hover and press only ever change the background and border, never the
 * label's colour: the old outline variant swapped its text to the page colour
 * on hover, which left labels like "See Events" at 1.1:1.
 *
 * Focus uses the global 3px :focus-visible outline (globals.css), which also
 * survives forced-colours mode.
 */
const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[background-color,border-color] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-brand-foreground hover:bg-brand-hover active:bg-brand-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-brand-hover",
        outline:
          "border border-input bg-transparent text-foreground hover:border-foreground hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        link: "text-primary underline underline-offset-4 hover:decoration-2",
      },
      /* 2.5.5 Target Size (Enhanced) — every target is at least 44x44 CSS px. */
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-11 px-4",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Style the child (usually an <a> or <Link>) as a button. It keeps its own
   *  role: a link styled as a button is still a link to assistive tech, and
   *  Enter, not Space, follows it. */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type ?? "button"}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
