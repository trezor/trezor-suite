import { type NetworkSymbol, networks } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import {
    AMOUNT_UNIT_ZERO,
    type AmountSubunit,
    type AmountUnit,
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
    baseCurrencyAmountToAmountUnit,
    toAmountSubunit,
    toAmountUnit,
} from './baseCurrencyTypes';

type SymbolOrDecimals = { symbol: NetworkSymbol } | { decimals: number };

const getAccountDecimals = (symbol: NetworkSymbol) => networks[symbol]?.decimals;

const subunitsToUnits = (params: { value: AmountSubunit } & SymbolOrDecimals): AmountUnit => {
    const decimals = 'decimals' in params ? params.decimals : getAccountDecimals(params.symbol);
    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return toAmountUnit(params.value.div(factor));
};

const unitsToSubunits = (params: { value: AmountUnit } & SymbolOrDecimals): AmountSubunit => {
    const decimals = 'decimals' in params ? params.decimals : getAccountDecimals(params.symbol);
    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return toAmountSubunit(params.value.multipliedBy(factor));
};

type ToFiatCurrencyParams = {
    // Todo: remove `string`, its used only for backwards compatibility.
    amount: string | AmountUnit;
    rate: number | undefined;
};

/**
 * This function does only numerical operations, formatting is to be handled in formatters.
 */
export const toFiatCurrency = ({
    amount,
    rate,
}: ToFiatCurrencyParams): BaseCurrencyAmount | null => {
    if (!rate) {
        return null;
    }

    let formattedAmount = amount;
    if (typeof amount === 'string') {
        formattedAmount = amount.replace(',', '.');
    }

    const baseCurrencyAmount = new BigNumber(formattedAmount).times(rate);
    if (baseCurrencyAmount.isNaN()) {
        return null;
    }

    return asBaseCurrencyAmount(baseCurrencyAmount);
};

type FromBaseCurrencyParams = {
    // Todo: remove string.
    fiatAmount: string | BaseCurrencyAmount;
    rate: number | undefined;
};

/**
 * This function does only numerical operations, formatting is to be handled in formatters.
 */
export const fromBaseCurrencyToCryptoUnit = ({
    fiatAmount,
    rate,
}: FromBaseCurrencyParams): AmountUnit | null => {
    if (!rate) {
        return null;
    }

    let formattedBaseCurrencyAmount = fiatAmount;
    if (typeof fiatAmount === 'string') {
        formattedBaseCurrencyAmount = fiatAmount.replace(',', '.');
    }

    const amount = new BigNumber(formattedBaseCurrencyAmount).div(rate);

    return amount.isNaN() ? null : toAmountUnit(amount);
};

export const BASE_CURRENCY_ZERO = asBaseCurrencyAmount(new BigNumber(0));

export const isBaseCurrencyWithSats = (baseCurrency: BaseCurrencyCode) => baseCurrency === 'btc';

type GetDecimalsForBaseCurrencyParams = {
    code: BaseCurrencyCode | '';
    isInSats: boolean;
};

export const getDecimalsForBaseCurrency = ({
    code,
    isInSats,
}: GetDecimalsForBaseCurrencyParams) => {
    if (code !== '' && isBaseCurrencyWithSats(code) && isInSats) {
        return 0;
    }

    return code in networks ? networks[code as NetworkSymbol].decimals : 2;
};

type AmountToFiatCurrencyWithSatsConversionParams = {
    cryptoAmount: AmountUnit;
    rate: number;
    baseCurrencyCode: BaseCurrencyCode;
    baseCurrencyToSats: boolean;
};

const amountToFiatCurrencyWithSatsConversion = ({
    cryptoAmount,
    rate,
    baseCurrencyCode,
    baseCurrencyToSats,
}: AmountToFiatCurrencyWithSatsConversionParams) => {
    const baseCurrencyAmountUnit = toFiatCurrency({ amount: cryptoAmount, rate });

    if (baseCurrencyAmountUnit === null) {
        return null;
    }

    const shouldConvertToSats = isBaseCurrencyWithSats(baseCurrencyCode) && baseCurrencyToSats;

    return shouldConvertToSats
        ? asBaseCurrencyAmount(
              unitsToSubunits({
                  value: baseCurrencyAmountToAmountUnit(baseCurrencyAmountUnit),
                  symbol: 'btc',
              }),
          )
        : baseCurrencyAmountUnit;
};

type ParseCryptoToFormattedBaseCurrencyParams = {
    areSatsDisplayed: boolean;
    baseCurrencyToSats: boolean;
    symbol: NetworkSymbol;
    value: BigNumber;
    rate: number;
    baseCurrencyCode: BaseCurrencyCode;
};

export const parseCryptoToFormattedBaseCurrency = ({
    areSatsDisplayed,
    baseCurrencyToSats,
    symbol,
    value,
    rate,
    baseCurrencyCode,
}: ParseCryptoToFormattedBaseCurrencyParams) => {
    const cryptoAmount = baseCurrencyToSats
        ? subunitsToUnits({ value: toAmountSubunit(value), symbol })
        : toAmountUnit(value);

    const baseCurrencyDisplay = amountToFiatCurrencyWithSatsConversion({
        cryptoAmount,
        rate,
        baseCurrencyCode,
        baseCurrencyToSats: areSatsDisplayed,
    });

    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        isInSats: areSatsDisplayed,
        code: baseCurrencyCode,
    });

    return baseCurrencyDisplay?.toFixed(baseCurrencyDecimals) ?? null;
};

type ParseBaseCurrencyToFormattedCryptoParams = {
    areSatsDisplayed: boolean;
    isCryptoInSats: boolean;
    value: BigNumber;
    rate: number;
    cryptoDecimals: number;
};

export const parseBaseCurrencyToFormattedCrypto = ({
    areSatsDisplayed,
    isCryptoInSats,
    value,
    rate,
    cryptoDecimals,
}: ParseBaseCurrencyToFormattedCryptoParams) => {
    const baseCurrencyUnitAmount = asBaseCurrencyAmount(
        areSatsDisplayed
            ? subunitsToUnits({
                  value: toAmountSubunit(value),
                  symbol: 'btc',
              })
            : value,
    );

    const cryptoAmount = fromBaseCurrencyToCryptoUnit({ fiatAmount: baseCurrencyUnitAmount, rate });

    const valueToDisplay = isCryptoInSats
        ? unitsToSubunits({
              value: cryptoAmount ?? AMOUNT_UNIT_ZERO,
              decimals: cryptoDecimals,
          })
        : cryptoAmount;

    const finalValueDecimals = isCryptoInSats ? 0 : cryptoDecimals;

    return valueToDisplay?.toFixed(finalValueDecimals) ?? null;
};
