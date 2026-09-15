import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount, type TokenAddress } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getFiatRateKey,
    isTestnet,
    subunitsToUnits,
    toBaseCurrencyDisplayAmount,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { convertTokenValueToDecimal } from '../utils';

type FiatFromCryptoValueRootState = FiatRatesRootState & WalletSettingsRootState;

type UseFiatFromCryptoValueParams = {
    cryptoValue: string | null;
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    tokenDecimals?: number;
    historicRate?: number;
    useHistoricRate?: boolean;
    isBalance?: boolean;
};

const selectFiatFromCryptoValue = (
    state: FiatFromCryptoValueRootState,
    {
        cryptoValue,
        symbol,
        tokenAddress,
        historicRate,
        useHistoricRate,
        isBalance = false,
        tokenDecimals = 0,
    }: UseFiatFromCryptoValueParams,
): BaseCurrencyAmount | null => {
    if (!cryptoValue || isTestnet(symbol)) return null;

    const fiatCurrencyCode = selectBaseCurrency(state);
    const fiatRateKey = getFiatRateKey(symbol, fiatCurrencyCode, tokenAddress);
    const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey);
    const rate = useHistoricRate ? historicRate : currentRate?.rate;

    if (tokenAddress) {
        const decimalValue = convertTokenValueToDecimal(cryptoValue, tokenDecimals);

        // Zero balance always yields zero fiat regardless of rate — rate: 1 is a dummy (0 × n = 0).
        if (new BigNumber(decimalValue).isZero()) return toFiatCurrency({ amount: '0', rate: 1 });
        if (!rate || currentRate?.error) return null;

        return toFiatCurrency({ amount: decimalValue, rate });
    }

    if (!rate || currentRate?.error) return null;

    // A balance is already in network units; other values come in sats and must be converted.
    const networkAmount = isBalance
        ? cryptoValue
        : subunitsToUnits({ value: asAmountSubunit(new BigNumber(cryptoValue)), symbol });

    return toFiatCurrency({ amount: networkAmount, rate });
};

const areFiatAmountsEqual = (a: BaseCurrencyAmount | null, b: BaseCurrencyAmount | null) =>
    a === b || (a !== null && b !== null && a.eq(b));

export const useFiatFromCryptoValue = (
    params: UseFiatFromCryptoValueParams,
): BaseCurrencyAmount | null =>
    useSelector((state: FiatFromCryptoValueRootState) => {
        const fiatAmount = selectFiatFromCryptoValue(state, params);

        return fiatAmount === null
            ? null
            : toBaseCurrencyDisplayAmount({
                  value: fiatAmount,
                  baseCurrencyCode: selectBaseCurrency(state),
              });
    });

export const useExactFiatFromCryptoValue = (
    params: UseFiatFromCryptoValueParams,
): BaseCurrencyAmount | null =>
    useSelector(
        (state: FiatFromCryptoValueRootState) => selectFiatFromCryptoValue(state, params),
        areFiatAmountsEqual,
    );
