import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import s from "./Button.module.css"

const VARIANTS = {
  default: s.default,
  brand: s.brand,
  outline: s.outline,
  secondary: s.secondary,
  ghost: s.ghost,
  destructive: s.destructive,
  link: s.link,
};

const SIZES = {
  default: s.sizeDefault,
  sm: s.sizeSm,
  lg: s.sizeLg,
  icon: s.sizeIcon,
};

function buttonVariants({ variant = "default", size = "default", className } = {}) {
  return cn(s.base, VARIANTS[variant], SIZES[size], className);
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={buttonVariants({ variant, size, className })}
      {...props} />
  );
}

export { Button, buttonVariants }
