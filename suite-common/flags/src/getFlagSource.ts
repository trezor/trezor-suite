import { resolveStaticPath } from '@trezor/env-utils';

import { type FlagType } from './types';

// Web: build a URL to the static asset; SVGs are copied to /static/flags/ by the build pipeline
// (webpack CopyPlugin for web/desktop, static-copy plugin for vite, staticDirs mount for storybook).
export const getFlagSource = (country: FlagType): string =>
    resolveStaticPath(`flags/${country.toLowerCase()}.svg`);
