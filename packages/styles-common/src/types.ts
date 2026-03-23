import type { CSSColor } from '@trezor/theme';

import type { getValueAndUnit, isDarkColor, multiply, negative, sum } from './utils';

export type Direction = 'ltr' | 'rtl';

export interface DirectionUtils {
    direction: Direction;
    isLtr: boolean;
    isRtl: boolean;
}

export type ColorTransformFunction = (amount: string | number, color: CSSColor) => CSSColor;

export interface UniversalStyleUtils extends DirectionUtils {
    getValueAndUnit: typeof getValueAndUnit;
    multiply: typeof multiply;
    sum: typeof sum;
    negative: typeof negative;
    darken: ColorTransformFunction;
    lighten: ColorTransformFunction;
    transparentize: ColorTransformFunction;
    isDarkColor: typeof isDarkColor;
}
