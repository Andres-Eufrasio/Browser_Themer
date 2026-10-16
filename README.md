# Userstyles Customizer

Customize your preferred [Gruvbox](https://github.com/morhetz/gruvbox),
[Everforest](https://github.com/sainnhe/everforest) or
[Kanagawa](https://github.com/rebelot/kanagawa.nvim) palette, contrast level and
accent color for ported userstyles, and generate a JSON file for installing in
[Stylus](https://github.com/openstyles/stylus).

Each userstyle lets you pick a light and dark palette (Gruvbox, Everforest or
Kanagawa), a contrast level (hard, medium or soft) and an accent color.

Matching **browser themes** are available too, so the browser chrome agrees with
the themed sites. `pnpm themes` writes one theme per flavour to `themes/` (18 in
total), and the app's _Browser theme_ button downloads the theme for whatever
palette, contrast and accent are currently selected.

- **Chrome / Edge / Brave** — the theme folder is loadable directly:
  `chrome://extensions` → Developer mode → _Load unpacked_ → pick the folder.
- **Firefox** — unsigned themes need a signature, so either load it temporarily
  through `about:debugging#/runtime/this-firefox` or sign the bundled `.xpi` for
  free on addons.mozilla.org.

Themes come from the same `scripts/palette-data.mjs` colours as the userstyles,
and only recolour browser UI — tabs, toolbar, omnibox, menus, New Tab page — so
no page content changes.

## Development

```
git clone https://github.com/uncenter/catppuccin-userstyles-customizer.git
cd catppuccin-userstyles-customizer
pnpm install
node scripts/build-import.mjs
pnpm dev
```

`scripts/build-import.mjs` regenerates the bundled `import.json` from the tracked
Catppuccin reference export (`cattpuchin-mocha.json`) and the palette definitions
in `scripts/palette-data.mjs` (run `node scripts/gen-palettes.mjs` afterwards to
refresh the app's `src/palettes.json`).

`scripts/build-themes.mjs` (`pnpm themes`) generates the browser themes in
`themes/` from the same palette definitions. Its manifest builders and ZIP writer
live in `scripts/theme.mjs` and `scripts/zip.mjs`, which are dependency-free so
the app can reuse them for the _Browser theme_ download button.

Styles whose upstream port no longer matches the live site can be given a
hand-maintained replacement body in `scripts/bodies/` (see the `BODY_OVERRIDES`
map in `scripts/build-import.mjs`). Those files are written in the same reference
form as upstream — `#catppuccin(@flavor)` plus the Catppuccin colour names — so
the shared transform and the inlined palette library still apply.

## License

[MIT](LICENSE)
