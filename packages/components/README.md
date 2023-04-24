# @trezor/components

This repository contains components, images and hooks that do not depend on Suite-specific context, i.e. can be used in other Trezor-related projects as well. So far, they have only been used in Suite and @trezor/connect-ui.

## Storybook

Each component can be inspected separately in [Storybook](https://storybook.js.org/). Stories are deployed automatically by a nightly pipeline via `storybook-build` command to https://suite.corp.sldev.cz/components/develop. To see your local changes, run Storybook locally:

`yarn workspace @trezor/components storybook`

## Icons

Icons in Suite are SVGs stored in [src/images/icons](./src/images/icons) and accessed via [icons.ts](./src/components/Icon/icons.ts). The SVGs should follow a set of rules so that they are efficient and easy to handle:

-   minify the icon file by an [optimizer](https://iconly.io/tools/svg-cleaner)
-   the icon should be defined by fills rather than strokes - you can use an [online tool](https://iconly.io/tools/svg-convert-stroke-to-fill) or ask the designer if it does not work properly
-   edit the SVG so that it's `width`, `height`, `opacity`, `fill` etc. are not defined - this should be handled by Suite
-   if needed, the space around the icon can be cropped using an [online tool](https://svgcrop.com/) and/or by tweaking the [viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox) property
