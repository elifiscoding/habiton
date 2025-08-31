import React from "react"
import clsx from "clsx"

/**
 * Button with Tailwind static classes (so styles are generated).
 * Variants: default | primary | success | danger | switch
 * Size: sm | md
 */
export default function Button({
  size = "md",
  variant = "default",
  isActive,       // only used when variant="switch"
  className,
  children,
  ...rest
}) {
  const sizes = {
    md: "px-3 py-2 text-sm",
    sm: "px-2 py-1 text-xs h-8",
  }

  const variants = {
    default:
      "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 " +
      "dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600",
    primary:
      "text-white bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
    success:
      "text-white bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-offset-1 focus:ring-green-500",
    danger:
      "text-white bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-offset-1 focus:ring-red-500",
  }

  if (variant === "switch") {
    return (
      <button
        type="button"
        aria-pressed={isActive}
        role="switch"
        className={clsx(
          "relative w-8 h-4 rounded-full transition",
          isActive ? "bg-green-500" : "bg-gray-400",
          className
        )}
        {...rest}
      >
        <span
          className={clsx(
            "absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition",
            isActive ? "left-4" : "left-0.5"
          )}
        />
      </button>
    )
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
