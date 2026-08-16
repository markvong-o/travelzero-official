import * as React from "react"
import { cn } from "@/lib/utils"
import s from "./Card.module.css"

const VARIANTS = {
  flat: s.flat,
  default: "",
  raised: s.raised,
};

function Card({ className, size = "default", variant = "default", ...props }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(s.card, VARIANTS[variant], className)}
      {...props} />
  );
}

function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn(s.header, className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <div data-slot="card-title" className={cn(s.title, className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <div data-slot="card-description" className={cn(s.description, className)} {...props} />;
}

function CardAction({ className, ...props }) {
  return <div data-slot="card-action" className={className} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn(s.content, className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div data-slot="card-footer" className={cn(s.footer, className)} {...props} />;
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
