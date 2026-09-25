import { type CSSProperties } from 'react';

import { Translation } from '@suite/intl';
import { type Locale } from '@suite-common/suite-types';
import { type FractionButtonProps } from '@trezor/components';
import { typographyStylesBase } from '@trezor/theme';
import { clamp, localizeNumber } from '@trezor/utils';

import { type TradingUseFormActionsReturnProps } from 'src/types/trading/tradingForm';

export const TRADING_AMOUNT_PLACEHOLDER = '0.0';

const {
    fontSize: maxFontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
} = typographyStylesBase['headline-md'];

const FULL_SIZE_AMOUNT_LENGTH = 12;
const MIN_AMOUNT_FONT_SIZE = Math.ceil(maxFontSize / 2);

export const getTradingAmountInputStyle = (
    value: string | undefined,
    locale: Locale,
): CSSProperties => {
    const displayedLength = localizeNumber(value ?? '', locale).length;
    const scaledFontSize = clamp(
        Math.floor((maxFontSize * FULL_SIZE_AMOUNT_LENGTH) / displayedLength),
        MIN_AMOUNT_FONT_SIZE,
        maxFontSize,
    );

    return {
        fontSize: scaledFontSize,
        lineHeight: `${lineHeight}px`,
        fontWeight,
        letterSpacing,
    };
};

export type FormPercentButtonValue = '10%' | '25%' | '50%' | 'max';

export type FractionButtonWithPercentValue = FractionButtonProps & {
    percentValue: FormPercentButtonValue;
};

export const generateFractionButtons = (
    helpers: TradingUseFormActionsReturnProps,
): FractionButtonWithPercentValue[] => [
    {
        id: 'TR_FRACTION_BUTTONS_25_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_25_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        percentValue: '25%',
        onClick: () => helpers.setRatioAmount(4),
    },
    {
        id: 'TR_FRACTION_BUTTONS_50_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_50_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        percentValue: '50%',
        onClick: () => helpers.setRatioAmount(2),
    },
    {
        id: 'TR_FRACTION_BUTTONS_MAX',
        children: <Translation id="TR_FRACTION_BUTTONS_MAX" />,
        percentValue: 'max',
        onClick: () => helpers.setAllAmount(),
    },
];
