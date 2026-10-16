# Userstyles Customizer

Customize your preferred [Gruvbox](https://github.com/morhetz/gruvbox),
[Everforest](https://github.com/sainnhe/everforest) or
[Kanagawa](https://github.com/rebelot/kanagawa.nvim) palette, contrast level and
accent color for ported userstyles, and generate a JSON file for installing in
[Stylus](https://github.com/openstyles/stylus).

Each userstyle lets you pick a light and dark palette (Gruvbox, Everforest or
Kanagawa), a contrast level (hard, medium or soft) and an accent color.

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

Styles whose upstream port no longer matches the live site can be given a
hand-maintained replacement body in `scripts/bodies/` (see the `BODY_OVERRIDES`
map in `scripts/build-import.mjs`). Those files are written in the same reference
form as upstream — `#catppuccin(@flavor)` plus the Catppuccin colour names — so
the shared transform and the inlined palette library still apply.

## License

[MIT](LICENSE)
