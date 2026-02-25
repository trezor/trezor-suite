import { A, F, pipe } from '@mobily/ts-belt';

import {
    TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import {
    CryptoBaseCurrencyPair,
    Rate,
    RateTypeWithoutHistoric,
    RatesByKey,
    RatesByTimestamps,
    TickerId,
    Timestamp,
} from '@suite-common/wallet-types';
import {
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { MAX_AGE } from './fiatRatesConstants';
import { FiatRatesRootState } from './fiatRatesTypes';
import { selectDeviceAccounts } from '../accounts/accountsSelectors';

export const selectCurrentFiatRates = (state: FiatRatesRootState): RatesByKey | undefined =>
    state.wallet.fiat?.['current'];

export const selectHistoricFiatRates = (state: FiatRatesRootState): RatesByTimestamps | undefined =>
    state.wallet.fiat?.['historic'];

export const selectFiatRatesByFiatRateKey = (
    state: FiatRatesRootState,
    fiatRateKey: CryptoBaseCurrencyPair,
    rateType: RateTypeWithoutHistoric = 'current',
): Rate | undefined => state.wallet.fiat?.[rateType]?.[fiatRateKey];

export const selectHistoricFiatRatesByTimestamp = (
    state: FiatRatesRootState,
    fiatRateKey: CryptoBaseCurrencyPair,
    timestamp: Timestamp,
): number | undefined => {
    const roundedTimestamp = roundTimestampToNearestPastHour(timestamp);

    return state.wallet.fiat?.['historic']?.[fiatRateKey]?.[roundedTimestamp];
};

export const selectIsFiatRateLoading = (
    state: FiatRatesRootState,
    fiatRateKey: CryptoBaseCurrencyPair,
    rateType: RateTypeWithoutHistoric = 'current',
) => {
    const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType);

    return currentRate?.isLoading ?? false;
};

export const selectIsTickerLoading = (
    state: FiatRatesRootState,
    ticker: TickerId,
    fiatCurrency: BaseCurrencyCode,
    rateType: RateTypeWithoutHistoric = 'current',
) => {
    const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);

    return selectIsFiatRateLoading(state, fiatRateKey, rateType);
};

export const selectShouldUpdateFiatRate = (
    state: FiatRatesRootState,
    currentTimestamp: Timestamp,
    fiatRateKey: CryptoBaseCurrencyPair,
    rateType: RateTypeWithoutHistoric = 'current',
) => {
    const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType);

    if (!currentRate) {
        return true;
    }

    const { lastSuccessfulFetchTimestamp } = currentRate;

    return currentTimestamp - lastSuccessfulFetchTimestamp > MAX_AGE[rateType];
};

export const selectTickerFromAccounts = (
    state: FiatRatesRootState & TokenDefinitionsRootState,
): TickerId[] => {
    const accounts = selectDeviceAccounts(state as any);

    return pipe(
        accounts,
        A.map(account => [
            {
                symbol: account.symbol,
            } as TickerId,
            ...(account.tokens || [])
                .filter(token => new BigNumber(token.balance ?? '0').gt(0))
                .map(
                    token =>
                        ({
                            symbol: account.symbol,
                            tokenAddress: token.contract,
                        }) as TickerId,
                ),
        ]),
        A.flat,
        A.filter(
            ticker =>
                !ticker.tokenAddress ||
                selectIsSpecificCoinDefinitionKnown(state, ticker.symbol, ticker.tokenAddress),
        ),
        A.uniqBy(ticker =>
            ticker.tokenAddress ? `${ticker.symbol}-${ticker.tokenAddress}` : ticker.symbol,
        ),
        F.toMutable,
    );
};

export const selectTickersToBeUpdated = (
    state: FiatRatesRootState & TokenDefinitionsRootState,
    currentTimestamp: Timestamp,
    fiatCurrency: BaseCurrencyCode,
    rateType: RateTypeWithoutHistoric,
): TickerId[] => {
    const tickers = selectTickerFromAccounts(state);

    return tickers.filter(ticker => {
        const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);

        return (
            selectShouldUpdateFiatRate(state, currentTimestamp, fiatRateKey, rateType) &&
            !selectIsTickerLoading(state, ticker, fiatCurrency, rateType)
        );
    });
};
