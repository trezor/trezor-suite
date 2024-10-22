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
3. Sometimes you need to rebuild/restart app to see changes.

## In case some icons are not rendering correctly in icon font

1. Copy path from svg file of broken icon.
2. Open `https://codepen.io/herrstrietzel/pen/MWQVoLp` and paste path there.
3. Uncheck `directions` checkbox.
4. Inspect fix path output preview SVG in Chrome DevTools.
5. Copy SVG code from Chrome DevTools and replace original SVG code (do not use that fixed path directly, it won't work for some reason).
6. Regenerate icons with `yarn generate-icons`.
