import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type AccountKey, type RateTypeWithoutHistoric } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { createThunk } from '@trezor/redux-utils';

import {
    type FiatRatesApiQueryState,
    fiatRatesApi,
    getFiatRateEndpointName,
    getFiatRateMaxAgeInSeconds,
} from './fiatRatesApi';
import { FIAT_RATES_MODULE_PREFIX } from './fiatRatesConstants';
import { selectHistoricFiatRates, selectTickerFromAccounts } from './fiatRatesSelectors';
import { type FiatRatesHistoricRootState } from './fiatRatesTypes';
import { getMissingHistoricFiatRatesQueryArgs } from './getMissingHistoricFiatRatesQueryArgs';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import {
    type WalletSettingsRootState,
    selectBaseCurrency,
} from '../settings/walletSettingsReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectAccountTransactions } from '../transactions/transactionsSelectors';

type PrefetchFiatRatesThunkParams = {
    rateType: RateTypeWithoutHistoric;
};

export type PrefetchFiatRatesThunkState = AccountsRootState &
    TokenDefinitionsRootState &
    WalletSettingsRootState &
    FiatRatesApiQueryState;

/**
 * Warms up the cache with the rates of all accounts, so that views which subscribe to them later
 * can show them immediately. Fetching and polling are otherwise driven by the subscribed views.
 */
export const prefetchFiatRatesThunk = createThunk<
    void,
    PrefetchFiatRatesThunkParams,
    { state: PrefetchFiatRatesThunkState }
>(`${FIAT_RATES_MODULE_PREFIX}/prefetchFiatRates`, ({ rateType }, { dispatch, getState }) => {
    const baseCurrencyCode = selectBaseCurrency(getState());
    const endpointName = getFiatRateEndpointName(rateType);

    selectTickerFromAccounts(getState())
        .filter(ticker => !isTestnet(ticker.symbol))
        .forEach(ticker => {
            dispatch(
                fiatRatesApi.util.prefetch(
                    endpointName,
                    { ticker, baseCurrencyCode },
                    { ifOlderThan: getFiatRateMaxAgeInSeconds(rateType) },
                ),
            );
        });
});

type FetchMissingHistoricFiatRatesThunkParams = {
    accountKey: AccountKey;
};

export type FetchMissingHistoricFiatRatesThunkState = AccountsRootState &
    TransactionsRootState &
    WalletSettingsRootState &
    FiatRatesHistoricRootState &
    FiatRatesApiQueryState;

/**
 * Fetches the historic rates missing for the transactions of an account, for flows which need them
 * outside of a mounted view, e.g. the transactions export.
 */
export const fetchMissingHistoricFiatRatesThunk = createThunk<
    void,
    FetchMissingHistoricFiatRatesThunkParams,
    { state: FetchMissingHistoricFiatRatesThunkState }
>(
    `${FIAT_RATES_MODULE_PREFIX}/fetchMissingHistoricFiatRates`,
    async ({ accountKey }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) return;

        const queryArgsList = getMissingHistoricFiatRatesQueryArgs({
            account,
            transactions: selectAccountTransactions(getState(), accountKey),
            historicFiatRates: selectHistoricFiatRates(getState()),
            baseCurrencyCode: selectBaseCurrency(getState()),
        });

        await Promise.all(
            queryArgsList.map(queryArgs =>
                dispatch(
                    fiatRatesApi.endpoints.getHistoricFiatRates.initiate(queryArgs, {
                        subscribe: false,
                    }),
                ),
            ),
        );
    },
);
