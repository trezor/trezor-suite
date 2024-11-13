import { CSSColor } from '@trezor/theme';

import { UIVariant, UISize } from '../../config/types';

export const iconCircleVariants = [
    'primary',
    'warning',
    'destructive',
    'info',
    'tertiary',
] as const;

export type IconCircleVariant = Extract<UIVariant, (typeof iconCircleVariants)[number]>;

export type IconCircleColors = { foreground: CSSColor; background: CSSColor };

export type IconCircleExclusiveColorOrVariant =
    | { variant?: IconCircleVariant; iconColor?: undefined }
    | { variant?: undefined; iconColor?: IconCircleColors };

export const iconCirclePaddingTypes = ['small', 'medium', 'large'] as const;
export type IconCirclePaddingType = Extract<UISize, (typeof iconCirclePaddingTypes)[number]>;
