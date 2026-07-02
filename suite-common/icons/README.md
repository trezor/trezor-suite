# @suite-common/icons

This package contains source assets for icons used in the app.

## How to add or update icon

1. Export icon as SVG from Figma (no other types than SVG are allowed).
2. Rename icon to follow camel case convention (`Warning Circle.svg` => `warningCircle.svg`).
3. Run `yarn generate-icons` - this will do some necessary changes in SVG structure like removing dimensions and some optimization using [SVGO library](https://github.com/svg/svgo). It will also regenerate `src/icons.ts` file.
4. You can use your newly added icon 🎉.

## How to update icon font for mobile app

1. Register new icon in `generateIconFont.ts` file.
2. Run `yarn generate-icons` to generate new font file.
3. Rebuild/restart app (incl. shutting down emulator & rerunning `yarn native:prebuild`).

## In case some icons are not rendering correctly in icon font

1. Copy a whole path from the SVG file of the problematic icon.
2. Open `https://yqnn.github.io/svg-path-editor/` and paste the path there.
3. Select the problematic segment in the _Commands_ section and fix it by running _Reverse Subpath_.
4. Check the _Minify output_ checkbox and copy&paste the fixed path back into the SVG file.
5. Regenerate icons with `yarn generate-icons`.
