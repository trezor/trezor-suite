import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { type RateTypeWithoutHistoric } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

export type FiatRateParams = {
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    rateType?: RateTypeWithoutHistoric;
    historicRate?: number;
    useHistoricRate?: boolean;
};

/**
 * The rate for a crypto value, as a number: it stays equal when a fetch leaves the price the same.
 * With `useHistoricRate` the current rate is not read, so its changes don't re-render.
 */
export const selectFiatRateForCryptoValue = (
    state: FiatRatesRootState & WalletSettingsRootState,
    { symbol, tokenAddress, rateType, historicRate, useHistoricRate }: FiatRateParams,
): number | undefined => {
    if (useHistoricRate) return historicRate;

    const currency = selectBaseCurrency(state);
    const fiatRateKey = getFiatRateKey(symbol, currency, tokenAddress);

    return selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType)?.rate;
};
