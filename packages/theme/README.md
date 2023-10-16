# @trezor/theme

This package contains theme for new Suite v2, currently used only in React Native app.

You can find Figma files for this theme here:

-   [colors](https://www.figma.com/file/YIFzn2vuwktwV4GzZClrYx/%5Bs2.0%5D-Trezor-Colors?node-id=0%3A1)
-   [font, borders, shadows...](https://www.figma.com/file/Z6AGVUmKQzLNtDozFamW7f/s2-Mobile?node-id=37%3A757)

# Fonts for React Native app

If you want to update fonts, place new fonts to `./fonts` folder in this package and then follow the guide in [suite-native README](../suite-native/README.md).

## Colors

To regenerate color schemas follow these steps:

Colors can be found in file `./src/colors.ts`

usage:
`tsx
    <Text color="newlyDefinedColorVariant" />
    `

### Older themes

For older themes (v1, v1.5) you can check `@trezor/components` package.
