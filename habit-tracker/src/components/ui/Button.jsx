import React from "react"
import clsx from "clsx"

/**
 * Button with Tailwind static classes (so styles are generated).
 * Variants: default | primary | success | danger
 * Size: sm | md
 */
export default function Button({ size = "md", variant = "default", className, children, ...rest }) {
  const sizes = {
    md: "px-3 py-2 text-sm",
    sm: "px-2 py-1 text-xs h-8",
  }

  const variants = {
    default: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 " +
             "dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600",
    primary: "text-white bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
    success: "text-white bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-offset-1 focus:ring-green-500",
    danger:  "text-white bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-offset-1 focus:ring-red-500",
  }

  return (
    <button
      className={clsx(
        "rounded-md font-medium shadow-sm transition",
        sizes[size],
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
