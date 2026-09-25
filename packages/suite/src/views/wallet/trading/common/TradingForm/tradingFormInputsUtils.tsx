import { type CSSProperties } from 'react';

import { Translation } from '@suite/intl';
import {
    asAmountSubunit,
    asAmountUnit,
    fromBaseCurrencyToCryptoUnit,
    subunitsToUnits,
    toFiatCurrency,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type FractionButtonProps } from '@trezor/components';
import { typographyStylesBase } from '@trezor/theme';
import { BigNumber, clamp } from '@trezor/utils';

import { type TradingUseFormActionsReturnProps } from 'src/types/trading/tradingForm';

export const TRADING_AMOUNT_PLACEHOLDER = '0.0';

const {
    fontSize: maxFontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
} = typographyStylesBase['headline-md'];

export const TRADING_AMOUNT_HEIGHT = lineHeight;
export const TRADING_AMOUNT_SKELETON_WIDTH = 120;
export const TRADING_BASE_CURRENCY_SKELETON_WIDTH = 60;

const FULL_SIZE_AMOUNT_LENGTH = 12;
const MIN_AMOUNT_FONT_SIZE = Math.ceil(maxFontSize / 2);

export const getTradingAmountInputStyle = (value: string | undefined): CSSProperties => {
    const scaledFontSize = clamp(
        Math.floor((maxFontSize * FULL_SIZE_AMOUNT_LENGTH) / (value?.length ?? 0)),
        MIN_AMOUNT_FONT_SIZE,
        maxFontSize,
    );

    return {
        fontSize: scaledFontSize,
        lineHeight: `${lineHeight}px`,
        height: TRADING_AMOUNT_HEIGHT,
        fontWeight,
        letterSpacing,
    };
};

type TradingAmountConversionParams = {
    rate: number | undefined;
    decimals: number;
    isInSats: boolean;
};

export const getTradingCryptoAmountFromBaseCurrency = ({
    baseCurrencyAmount,
    rate,
    decimals,
    isInSats,
}: TradingAmountConversionParams & { baseCurrencyAmount: string }) => {
    const cryptoAmount = fromBaseCurrencyToCryptoUnit({ fiatAmount: baseCurrencyAmount, rate });

    if (!baseCurrencyAmount || !cryptoAmount) {
        return '';
    }

    const roundedCryptoAmount = asAmountUnit(
        cryptoAmount.decimalPlaces(decimals, BigNumber.ROUND_DOWN),
    );

    return isInSats
        ? unitsToSubunits({ value: roundedCryptoAmount, decimals }).toFixed()
        : roundedCryptoAmount.toFixed();
};

export const getTradingBaseCurrencyAmountFromCrypto = ({
    cryptoAmount,
    rate,
    decimals,
    isInSats,
    baseCurrencyDecimals,
}: TradingAmountConversionParams & { cryptoAmount: string; baseCurrencyDecimals: number }) => {
    if (!cryptoAmount) {
        return '';
    }

    const cryptoAmountInUnits = isInSats
        ? subunitsToUnits({ value: asAmountSubunit(new BigNumber(cryptoAmount)), decimals })
        : asAmountUnit(new BigNumber(cryptoAmount));
    const baseCurrencyAmount = toFiatCurrency({ amount: cryptoAmountInUnits, rate });

    return baseCurrencyAmount?.decimalPlaces(baseCurrencyDecimals).toFixed() ?? '';
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
