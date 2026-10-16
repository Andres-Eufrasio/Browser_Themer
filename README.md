# Userstyles Customizer

Customize your preferred [Gruvbox](https://github.com/morhetz/gruvbox),
[Everforest](https://github.com/sainnhe/everforest),
[Kanagawa](https://github.com/rebelot/kanagawa.nvim) or
[Catppuccin](https://github.com/catppuccin/catppuccin) palette, contrast level
and accent color for ported userstyles, and generate a JSON file for installing
in [Stylus](https://github.com/openstyles/stylus).

Each userstyle lets you pick a light and dark palette (Gruvbox, Everforest,
Kanagawa, and Catppuccin's four flavours), a contrast level (hard, medium or
soft) and an accent color — the fifteen Catppuccin accent names plus the base
hues in bright/deep intensities.

Catppuccin is available at every flavour: **Latte** (light) and **Frappé**,
**Macchiato** and **Mocha** (dark). Each flavour is listed in both the Light and
Dark Flavor dropdowns, exactly as upstream did, so you can put a dark flavour on
the light side if you want one. Catppuccin defines no contrast variants, so the
Contrast setting has no effect on it (the app says so when both selections are
Catppuccin flavours).

Matching **browser themes** are available too, so the browser chrome agrees with
the themed sites. `pnpm themes` writes one theme per palette variant to
`themes/` (22 in total: 18 from Gruvbox/Everforest/Kanagawa ramps plus one per
Catppuccin flavour), and the app's _Browser theme_ button downloads the theme for
whatever palette, contrast and accent are currently selected.

- **Chrome / Edge / Brave** — the theme folder is loadable directly:
  `chrome://extensions` → Developer mode → _Load unpacked_ → pick the folder.
- **Firefox** — unsigned themes need a signature, so either load it temporarily
  through `about:debugging#/runtime/this-firefox` or sign the bundled `.xpi` for
  free on addons.mozilla.org.

Themes come from the same `scripts/palette-data.mjs` colours as the userstyles,
and only recolour browser UI — tabs, toolbar, omnibox, menus, New Tab page — so
no page content changes.

The same `pnpm themes` run also writes **Windows Terminal** themes, one
`settings.json` fragment per palette variant, to `themes/windows-terminal/`.
Each one holds only the two keys a terminal theme needs — `schemes` and
`themes` — and nothing personal (actions, profiles, keybindings), so you merge
it into your own `settings.json` yourself; the app's _Terminal theme_ button
downloads the same fragment for the current selection. The sixteen ANSI colours
follow Catppuccin's own Windows Terminal port, so they are fixed per palette:
the accent picker shapes the userstyles and the browser themes, not the
terminal.

## Development

```
git clone https://github.com/Andres-Eufrasio/Browser_Themer.git
cd Browser_Themer
pnpm install
node scripts/build-import.mjs
pnpm dev
```

`scripts/build-import.mjs` regenerates the bundled `import.json` from the tracked
Catppuccin reference export (`cattpuchin-mocha.json`) and the palette definitions
in `scripts/palette-data.mjs` (run `node scripts/gen-palettes.mjs` afterwards to
refresh the app's `src/palettes.json`). Catppuccin's hex values are the official
ones from the vendored `@catppuccin/palette` 1.8.0 package
(`catppuccin-palette-1.8.0.tgz`), so they match upstream exactly.

`scripts/build-themes.mjs` (`pnpm themes`) generates the browser themes and the
Windows Terminal fragments in `themes/` from the same palette definitions. Its
manifest builders, terminal theme builders and ZIP writer live in
`scripts/theme.mjs`, `scripts/terminal.mjs` and `scripts/zip.mjs`, which are
dependency-free so the app can reuse them for the _Browser theme_ and
_Terminal theme_ download buttons.

Styles whose upstream port no longer matches the live site can be given a
hand-maintained replacement body in `scripts/bodies/` (see the `BODY_OVERRIDES`
map in `scripts/build-import.mjs`). Those files are written in the same reference
form as upstream — `#catppuccin(@flavor)` plus the Catppuccin colour names — so
the shared transform and the inlined palette library still apply.

## License

[MIT](LICENSE)
