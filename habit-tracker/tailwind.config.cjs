import theme from "./src/theme.js"

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: theme.colors.primary.base,
        success: theme.colors.success.base,
        danger: theme.colors.danger.base,
        warning: theme.colors.warning.base,
      },
      borderRadius: theme.radii,
      spacing: theme.spacing,
    },
  },
  plugins: [],
}
