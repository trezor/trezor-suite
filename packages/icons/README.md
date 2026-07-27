# @trezor/icons

Icon SVG source assets and generated tree-shakeable React components for web.

The package exposes a compact generated type facade through `src/index.ts`. The runtime entry stays
in `src/generated/icons/index.ts` so TypeScript consumers do not load every generated icon module
into their project.

> Not yet used on native (Expo/Metro tree-shaking issue), but the setup is ready for it in the future.

## How to add or update an icon

1. Export the icon as SVG from Figma and rename it to camelCase (`Warning Circle.svg` → `warningCircle.svg`), place it in `assets/`.
2. Run `yarn generate-icons` from repo root.

## Usage

```tsx
import { WarningCircleIcon } from '@trezor/icons';
import { Icon } from '@trezor/components';

<Icon as={WarningCircleIcon} size={24} />;
```
