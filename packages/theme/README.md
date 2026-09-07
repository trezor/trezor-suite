# @trezor/theme

This package contains the shared theme used by Suite web, desktop, and React Native apps.

You can find the current design foundations here:

- [Semantic colors](https://trezor-zero.pages.dev/design-system/semantic-colors/)
- [Surface elevations](https://trezor-zero.pages.dev/design-system/surface-elevations/)

# Fonts for React Native app

If you want to update fonts, place new fonts to `./fonts` folder in this package and then follow the guide in [suite-native README](../suite-native/README.md).

## Colors

Semantic color tokens and their light and dark variants are defined in `./src/colors.ts`. Raw
palette values are defined in `./src/palette.ts`.

```tsx
<Text color="contentPrimary" />
```

### Debug intent

Use `intent="debug"` for developer tools, debug-only actions, and diagnostic badges. Its pink
colors distinguish these controls from regular product features. It does not enable or gate
debug functionality; keep the existing debug visibility checks. Do not use it for decoration,
product promotions, or actual warning/error states.

Web/desktop and mobile components share the `*Debug*` tokens, including soft and bold fills,
content, borders, and interaction states in both themes. Mobile text and icons use
`color="contentDebug"`. Components retain their usual disabled and loading behavior.
