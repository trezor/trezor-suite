# @trezor/components

This repository contains components, images and hooks that do not depend on Suite-specific context, i.e. can be used in other Trezor-related projects as well. So far, they have only been used in Suite.

## Storybook

Each component can be inspected separately in [Storybook](https://storybook.js.org/). Stories are deployed automatically by pipeline via `storybook-build` command to https://suite.corp.sldev.cz/components/develop. To see your local changes, run Storybook locally:

`yarn @workspace @trezor/components storybook`
