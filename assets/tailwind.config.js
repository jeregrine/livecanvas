// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

const plugin = require("tailwindcss/plugin")
const fs = require("fs")
const path = require("path")

// Tailwind colors for Flexoki theme by Steph Ango. https://stephango.com/flexoki
const colors = {
  black: '#100F0F',
  950: '#1C1B1A',
  900: '#282726',
  850: '#343331',
  800: '#403E3C',
  700: '#575653',
  600: '#6F6E69',
  500: '#878580',
  300: '#B7B5AC',
  200: '#CECDC3',
  150: '#DAD8CE',
  100: '#E6E4D9',
  50: '#F2F0E5',
  paper: '#FFFCF0',
  red: {
    DEFAULT: '#AF3029',
    light: '#D14D41',
  },
  orange: {
    DEFAULT: '#BC5215',
    light: '#DA702C',
  },
  yellow: {
    DEFAULT: '#AD8301',
    light: '#D0A215',
  },
  green: {
    DEFAULT: '#66800B',
    light: '#879A39',
  },
  cyan: {
    DEFAULT: '#24837B',
    light: '#3AA99F',
  },
  blue: {
    DEFAULT: '#205EA6',
    light: '#4385BE',
  },
  purple: {
    DEFAULT: '#5E409D',
    light: '#8B7EC8',
  },
  magenta: {
    DEFAULT: '#A02F6F',
    light: '#CE5D97',
  },
};


module.exports = {
  content: [
    "./js/**/*.js",
    "../lib/*_web.ex",
    "../lib/*_web/**/*.*ex"
  ],
  theme: {
    extend: {
      colors: colors
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    // Allows prefixing tailwind classes with LiveView classes to add rules
    // only when LiveView classes are applied, for example:
    //
    //     <div class="phx-click-loading:animate-ping">
    //
    plugin(({ addVariant }) => addVariant("phx-no-feedback", [".phx-no-feedback&", ".phx-no-feedback &"])),
    plugin(({ addVariant }) => addVariant("phx-click-loading", [".phx-click-loading&", ".phx-click-loading &"])),
    plugin(({ addVariant }) => addVariant("phx-submit-loading", [".phx-submit-loading&", ".phx-submit-loading &"])),
    plugin(({ addVariant }) => addVariant("phx-change-loading", [".phx-change-loading&", ".phx-change-loading &"])),

    // Embeds Heroicons (https://heroicons.com) into your app.css bundle
    // See your `CoreComponents.icon/1` for more information.
    //
    plugin(function({ matchComponents, theme }) {
      let iconsDir = path.join(__dirname, "./vendor/heroicons/optimized")
      let values = {}
      let icons = [
        ["", "/24/outline"],
        ["-solid", "/24/solid"],
        ["-mini", "/20/solid"]
      ]
      icons.forEach(([suffix, dir]) => {
        fs.readdirSync(path.join(iconsDir, dir)).map(file => {
          let name = path.basename(file, ".svg") + suffix
          values[name] = { name, fullPath: path.join(iconsDir, dir, file) }
        })
      })
      matchComponents({
        "hero": ({ name, fullPath }) => {
          let content = fs.readFileSync(fullPath).toString().replace(/\r?\n|\r/g, "")
          return {
            [`--hero-${name}`]: `url('data:image/svg+xml;utf8,${content}')`,
            "-webkit-mask": `var(--hero-${name})`,
            "mask": `var(--hero-${name})`,
            "mask-repeat": "no-repeat",
            "background-color": "currentColor",
            "vertical-align": "middle",
            "display": "inline-block",
            "width": theme("spacing.5"),
            "height": theme("spacing.5")
          }
        }
      }, { values })
    })
  ]
}
