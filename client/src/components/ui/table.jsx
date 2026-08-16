import * as React from "react"
import { cn } from "@/lib/utils"
import s from "./Table.module.css"

function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className={s.container}>
      <table data-slot="table" className={cn(s.table, className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead data-slot="table-header" className={cn(s.header, className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody data-slot="table-body" className={cn(s.body, className)} {...props} />;
}

function TableFooter({ className, ...props }) {
  return <tfoot data-slot="table-footer" className={cn(s.footer, className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return <tr data-slot="table-row" className={cn(s.row, className)} {...props} />;
}

function TableHead({ className, ...props }) {
  return <th data-slot="table-head" className={cn(s.head, className)} {...props} />;
}

function TableCell({ className, ...props }) {
  return <td data-slot="table-cell" className={cn(s.cell, className)} {...props} />;
}

function TableCaption({ className, ...props }) {
  return <caption data-slot="table-caption" className={cn(s.caption, className)} {...props} />;
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
