/**
 * Central design tokens for Habiton
 * You can import these into components or Tailwind config.
 */
const theme = {
  colors: {
    primary: {
      light: "#60a5fa", // blue-400
      base: "#3b82f6",  // blue-500
      dark: "#2563eb",  // blue-600
    },
    success: {
      light: "#86efac", // green-300
      base: "#22c55e",  // green-500
      dark: "#16a34a",  // green-600
    },
    danger: {
      light: "#fca5a5", // red-300
      base: "#ef4444",  // red-500
      dark: "#dc2626",  // red-600
    },
    warning: {
      light: "#fcd34d", // amber-300
      base: "#f59e0b",  // amber-500
      dark: "#d97706",  // amber-600
    },
    gray: {
      light: "#f3f4f6", // gray-100
      base: "#9ca3af",  // gray-400
      dark: "#374151",  // gray-700
    },
  },

  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem",  // 8px
    md: "1rem",    // 16px
    lg: "1.5rem",  // 24px
    xl: "2rem",    // 32px
  },

  radii: {
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    full: "9999px",
  },

  font: {
    base: "text-sm",
    heading: "text-lg font-semibold",
    subtle: "text-xs text-gray-500 dark:text-gray-400",
  },
}

export default theme
