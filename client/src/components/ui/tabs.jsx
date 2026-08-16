import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import s from "./Tabs.module.css"

function Tabs({ className, ...props }) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn(s.tabs, className)} {...props} />;
}

function TabsList({ className, ...props }) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn(s.list, className)} {...props} />;
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn(s.trigger, className)} {...props} />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" className={cn(s.content, className)} {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
