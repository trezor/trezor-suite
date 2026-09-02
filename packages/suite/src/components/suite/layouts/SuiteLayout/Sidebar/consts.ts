import { isDesktop } from '@trezor/env-utils';

export const SIDEBAR_COLLAPSED_WIDTH = 280;
export const SIDEBAR_MIN_WIDTH = isDesktop() ? 80 : 58;
export const SIDEBAR_MAX_WIDTH = 400;
export const SIDEBAR_AUTO_COLLAPSE_BREAKPOINT = 400;
