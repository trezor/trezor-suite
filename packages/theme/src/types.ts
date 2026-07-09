import { type RgbColor, type RgbaColor } from '@trezor/utils';

export type CSSColor = `#${string}` | RgbColor | RgbaColor | 'transparent' | 'currentColor';
