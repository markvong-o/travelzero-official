import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import s from "./Badge.module.css"

const VARIANTS = {
  default: s.default,
  secondary: s.secondary,
  outline: s.outline,
  destructive: s.destructive,
};

function badgeVariants({ variant = "default", className } = {}) {
  return cn(s.base, VARIANTS[variant], className);
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={badgeVariants({ variant, className })}
      {...props} />
  );
}

export { Badge, badgeVariants }
