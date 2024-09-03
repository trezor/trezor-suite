# @suite-common/icons

This package contains fully-fledged icon components using the Skia engine.

## How to add or update icon

1. Export icon as SVG from Figma (no other types than SVG are allowed).
2. Rename icon to follow camel case convention (`Warning Circle.svg` => `warningCircle.svg`).
3. Run `yarn generate-icons` - this will do some necessary changes in SVG structure like removing dimensions and some optimization using [SVGO library](https://github.com/svg/svgo). It will also regenerate `src/icons.ts` file.
4. You can use your newly added icon 🎉. Pay attention that file name without extension is what you need to put into Icon `name` prop:

```tsx
<Icon name="warningCircle" />
```
