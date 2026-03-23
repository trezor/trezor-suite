# @trezor/styles

Web/Desktop-only helpers for Suite styling.

## Current scope

This package now exports only web/Desktop helpers that are still used in Suite.
The styling runtime and native-specific APIs were moved out during the split:

1. Shared helpers live in `@trezor/styles-common`
1. Native styling APIs live in `@trezor/styles-native`

## Exports

### mediaQueries

```tsx
import { mediaQueries } from '@trezor/styles';

const hoverStyles = `
    ${mediaQueries.hover} {
        opacity: 1;
    }
`;
```

Some of the utils like `darken`, `lighten`, `transparentize` are just reexported from [polished](https://github.com/styled-components/polished) for best experience a to have everything in one place like our custom utils mentioned before.
