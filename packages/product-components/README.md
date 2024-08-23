# @trezor/product-components

This repository contains components, images and hooks that are product specific (usually related to Suite or Connect). It shouldn't contain basic primitive components. They should be placed in `@trezor/components` package.

## Storybook

Each component can be inspected separately in [Storybook](https://storybook.js.org/). Stories are deployed automatically by a nightly pipeline via `storybook-build` command to https://dev.suite.sldev.cz/product-components/develop/. To see your local changes, run Storybook locally:

`yarn workspace @trezor/product-components storybook`
