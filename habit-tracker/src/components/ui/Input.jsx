import React from "react"
import clsx from "clsx"

export default function Input({ size = "md", className, ...rest }) {
  const sizes = { md: "px-3 py-2 text-sm", sm: "px-2 py-1 text-xs h-8" }
  return (
    <input
      className={clsx(
        "w-full rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
        sizes[size],
        className
      )}
      {...rest}
    />
  )
}
