# @suite-common/icons

This package contains fully-fledged icon components using the Skia engine. There are three groups of icons in the package:

-   [icons](./assets/icons) - icons used to depict the universal concepts used commonly throughout a UI
-   [cryptoIcons](./assets/cryptoIcons) - a collection of icons representing main network coins (btc, eth, etc.)
-   [tokenIcons](./assets/cryptoIcons) - a collection of icons representing tokens (erc20, dai, link, usdt, etc.)
-   [flags](./assets/flags) - a collection of icons representing [country flags](https://github.com/HatScripts/circle-flags/tree/gh-pages/flags)

Icon components are ready to use only with React Native app now, but it is planned to be used by the web in the future as well.

Components and their definitions are split out into two separate files:

`Component.tsx` is picked up by Metro bundler for both Android and iOS platforms.

`Component.web.tsx` is picked up by the Webpack bundler for the web.

## How to add or update icon

1. Export icon as SVG from Figma (no other types than SVG are allowed).
2. Rename icon to follow camel case convention (`Warning Circle.svg` => `warningCircle.svg`).
3. Copy icon to the correct folder based on its context (crypto icon to [cryptoIcons](./assets/cryptoIcons), etc.)
4. Run `yarn generate-icons` - this will do some necessary changes in SVG structure like removing dimensions and some optimization using [SVGO library](https://github.com/svg/svgo). It will also regenerate `src/icons.ts` file.
5. You can use your newly added icon 🎉. Pay attention that file name without extension is what you need to put into Icon `name` prop:

```tsx
<Icon name="warningCircle" />
```

```tsx
<CryptoIcon symbol="btc" />
```
