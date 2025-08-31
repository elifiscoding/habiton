import React from "react"
import clsx from "clsx"

export default function Badge({ variant = "default", className, children }) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md"
  const variants = {
    default: "border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
    success: "border border-green-300 bg-green-100 text-green-700 dark:border-green-500 dark:bg-green-700 dark:text-green-100",
    danger:  "border border-red-300 bg-red-100 text-red-700 dark:border-red-500 dark:bg-red-700 dark:text-red-100",
    warning: "border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500 dark:bg-amber-700 dark:text-amber-100",
  }
  return <span className={clsx(base, variants[variant], className)}>{children}</span>
}
