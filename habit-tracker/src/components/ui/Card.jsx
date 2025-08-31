import React from "react"
import clsx from "clsx"

export default function Card({ size = "md", className, children, ...rest }) {
  const sizes = { md: "p-4", sm: "p-3" }
  return (
    <div
      className={clsx(
        "rounded-lg border shadow-sm transition",
        "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
