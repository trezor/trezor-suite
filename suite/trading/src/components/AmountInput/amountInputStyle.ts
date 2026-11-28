import { type CSSProperties } from 'react';

import { typographyStylesBase } from '@trezor/theme';
import { clamp } from '@trezor/utils';

const {
    fontSize: maxFontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
} = typographyStylesBase['headline-md'];

const FULL_SIZE_AMOUNT_LENGTH = 12;
const MIN_AMOUNT_FONT_SIZE = Math.ceil(maxFontSize / 2);

// TEMPORARY(POC): copy of getAmountInputStyle from packages/suite tradingFormInputsUtils, which
// @suite/trading cannot import. Delete the original together with the old trading form.
export const getAmountInputStyle = (displayValue: string): CSSProperties => {
    const scaledFontSize = clamp(
        Math.floor((maxFontSize * FULL_SIZE_AMOUNT_LENGTH) / displayValue.length),
        MIN_AMOUNT_FONT_SIZE,
        maxFontSize,
    );

    return {
        fontSize: scaledFontSize,
        lineHeight: `${lineHeight}px`,
        height: lineHeight,
        fontWeight,
        letterSpacing,
        fontFeatureSettings: 'normal',
    };
};
