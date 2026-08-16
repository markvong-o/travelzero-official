import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import s from "./Avatar.module.css"

function Avatar({ className, size = "default", ...props }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(s.root, className)}
      {...props} />
  );
}

function AvatarImage({ className, ...props }) {
  return (
    <AvatarPrimitive.Image data-slot="avatar-image" className={cn(s.image, className)} {...props} />
  );
}

function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(s.fallback, className)}
      {...props} />
  );
}

export { Avatar, AvatarImage, AvatarFallback }
