# @suite-common/icons

Icons for the native (mobile) app. General icon SVG sources live in `@trezor/icons` (`packages/icons/assets`).

## How to add or update an icon

1. Export the icon as SVG from Figma and rename it to camelCase (`Warning Circle.svg` → `warningCircle.svg`), place it in `@trezor/icons/assets`.
2. Run `yarn generate-icons` from repo root

## In case some icons are not rendering correctly in icon font

1. Copy a whole path from the SVG file of the problematic icon.
2. Open `https://yqnn.github.io/svg-path-editor/` and paste the path there.
3. Select the problematic segment in the _Commands_ section and fix it by running _Reverse Subpath_.
4. Check the _Minify output_ checkbox and copy&paste the fixed path back into the SVG file.
5. Regenerate icons with `yarn generate-icons`.
