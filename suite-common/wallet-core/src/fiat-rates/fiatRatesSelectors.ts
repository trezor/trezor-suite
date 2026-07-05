import { A, F, pipe } from '@mobily/ts-belt';

import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import {
    type CryptoBaseCurrencyPair,
    type Rate,
    type RateTypeWithoutHistoric,
    type RatesByKey,
    type RatesByTimestamps,
    type TickerId,
    type Timestamp,
    type TokenAddress,
} from '@suite-common/wallet-types';
import {
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { MAX_AGE } from './fiatRatesConstants';
import { type FiatRatesRootState } from './fiatRatesTypes';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccounts } from '../accounts/accountsSelectors';

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
    state: FiatRatesRootState & TokenDefinitionsRootState & AccountsRootState,
): TickerId[] => {
    // Use accounts of all remembered devices/wallets, not just the selected one, so that
    // token fiat rates are fetched for every wallet. Otherwise tokens that exist only on a
    // non-selected wallet (e.g. a passphrase wallet) never get a rate fetched on launch.
    const accounts = selectAccounts(state);

    return pipe(
        accounts,
        A.map((account): TickerId[] => [
            {
                symbol: account.symbol,
            },
            ...(account.tokens || [])
                .filter(token => new BigNumber(token.balance ?? '0').gt(0))
                .map(
                    token =>
                        ({
                            symbol: account.symbol,
                            tokenAddress: token.contract as TokenAddress,
                            protocols: token.protocols,
                        }) satisfies TickerId,
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
        A.sortBy(ticker => (ticker.tokenAddress ? 1 : 0)),
        F.toMutable,
    );
};

export const selectTickersToBeUpdated = (
    state: FiatRatesRootState & TokenDefinitionsRootState & AccountsRootState,
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
