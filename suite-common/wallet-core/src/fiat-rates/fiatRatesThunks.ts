import { differenceInMilliseconds, getUnixTime, subWeeks } from 'date-fns';

import {
    fetchCurrentFiatRates,
    fetchCurrentTokenFiatRates,
    fetchLastWeekFiatRates,
    getFiatRatesForTimestamps,
} from '@suite-common/fiat-services';
import TrezorConnect, { AccountTransaction, BlockchainFiatRatesUpdate } from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol, networksCompatibility as NETWORKS } from '@suite-common/wallet-config';
import { Account, CoinFiatRates, TickerId } from '@suite-common/wallet-types';
import { FIAT, FiatCurrencyCode } from '@suite-common/suite-config';
import { getAccountTransactions, isTestnet } from '@suite-common/wallet-utils';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';

import { fiatRatesActions, actionPrefix } from './fiatRatesActions';
import { selectCoins } from './fiatRatesReducer';
import { selectAccounts } from '../accounts/accountsReducer';
import { selectTransactions } from '../transactions/transactionsReducer';
import { selectBlockchainState } from '../blockchain/blockchainReducer';

let staleRatesTimeout: ReturnType<typeof setInterval>;
let lastWeekTimeout: ReturnType<typeof setInterval>;

// how often should suite check for outdated rates;
const INTERVAL = 1000 * 60 * 2; // 2 mins
const INTERVAL_LAST_WEEK = 1000 * 60 * 60 * 1; // 1 hour
// which rates should be considered outdated and updated;
const MAX_AGE = 1000 * 60 * 10; // 10 mins
const MAX_AGE_LAST_WEEK = 1000 * 60 * 60 * 1; // 1 hour

type GetFiatStaleTickersThunkPayload = {
    timestampFunc: (ticker: CoinFiatRates) => number | undefined | null;
    interval: number;
    includeTokens?: boolean;
};
type UpdateCurrentFiatRatesThunkPayload = { ticker: TickerId; maxAge?: number };
type UpdateTxsFiatRatesThunkPayload = {
    account: Account;
    txs: AccountTransaction[];
    localCurrency: FiatCurrencyCode;
};

export const removeFiatRatesForDisabledNetworksThunk = createThunk(
    `${actionPrefix}/removeRatesForDisabledNetworks`,
    (_, { dispatch, extra, getState }) => {
        const {
            selectors: { selectEnabledNetworks },
        } = extra;
        const enabledNetworks = selectEnabledNetworks(getState());
        const fiat = selectCoins(getState());
        fiat.forEach(f => {
            const rateNetwork = (f.mainNetworkSymbol ?? f.symbol) as NetworkSymbol;
            if (!enabledNetworks.includes(rateNetwork)) {
                dispatch(fiatRatesActions.removeFiatRate(f));
            }
        });
    },
);

/**
 *  Returns an array with coin tickers that need fullfil several conditions.
 *  Array of coin tickers is combined from 2 sources - config file and fiat reducer itself
 *  Conditions:
 *  1. network for a given ticker needs to be enabled
 *  2a. no rates available yet (first fetch)
 *  OR
 *  2b. duration since the last check is greater than passed `interval`
 *  Timestamp is extracted via `timestampFunc`.
 *
 */
export const getFiatStaleTickersThunk = createThunk(
    `${actionPrefix}/getStaleTickers`,
    (
        { timestampFunc, interval, includeTokens }: GetFiatStaleTickersThunkPayload,
        { extra, getState },
    ) => {
        const {
            selectors: { selectEnabledNetworks },
        } = extra;
        const enabledNetworks = selectEnabledNetworks(getState());
        const fiat = selectCoins(getState());
        const blockchain = selectBlockchainState(getState());

        const watchedCoinTickers = FIAT.tickers
            .filter(t => enabledNetworks.includes(t.symbol))
            // use only connected backends
            .filter(t => blockchain[t.symbol].connected);

        const needUpdateFn = (t: TickerId) => {
            // if no rates loaded yet, load them;
            if (fiat.length === 0) return true;
            const alreadyWatchedTicker = fiat.find(f => f.symbol === t.symbol);
            // is not in fiat[], means is not watched, for example coin was added in settings, add it
            if (!alreadyWatchedTicker) return true;

            const timestamp = timestampFunc(alreadyWatchedTicker);
            if (!timestamp) return true;
            // otherwise load only older ones
            return Date.now() - timestamp > interval;
        };

        const tickersToUpdate: TickerId[] = [];
        watchedCoinTickers
            .filter(needUpdateFn)
            .forEach(t => tickersToUpdate.push({ symbol: t.symbol }));

        if (includeTokens) {
            // use only tokens which mainNetworkSymbol are assigned to watchedCoinTickers
            const tokenTickers = fiat.filter(
                t =>
                    t.mainNetworkSymbol &&
                    watchedCoinTickers.find(w => w.symbol === t.mainNetworkSymbol),
            );
            tokenTickers.filter(needUpdateFn).forEach(t => tickersToUpdate.push(t));
        }

        return tickersToUpdate;
    },
);

/**
 * Fetch and update current fiat rates for a given ticker
 * Primary source of rates is TrezorConnect, coingecko serves as a fallback
 *
 */
export const updateCurrentFiatRatesThunk = createThunk(
    `${actionPrefix}/updateCurrentRates`,
    async (
        { ticker, maxAge = MAX_AGE }: UpdateCurrentFiatRatesThunkPayload,
        { dispatch, getState },
    ) => {
        const fiat = selectCoins(getState());
        const network = NETWORKS.find(t =>
            ticker.tokenAddress
                ? t.symbol === ticker.mainNetworkSymbol
                : t.symbol === ticker.symbol,
        );
        // skip testnets
        if (!network || network.testnet) return;

        if (maxAge > 0) {
            const existingRates = fiat.find(
                t =>
                    t.symbol === ticker.symbol &&
                    t.tokenAddress === ticker.tokenAddress &&
                    t.mainNetworkSymbol === ticker.mainNetworkSymbol,
            )?.current;

            // don't fetch if rates is fresh enough
            if (existingRates) {
                if (differenceInMilliseconds(new Date(), new Date(existingRates.ts)) < maxAge) {
                    return;
                }
            }
        }

        let results;
        try {
            if (!ticker.tokenAddress) {
                // standalone coins
                const response = await TrezorConnect.blockchainGetCurrentFiatRates({
                    coin: ticker.symbol,
                });
                results = response.success ? response.payload : null;
            }

            if (!results) {
                // Fallback for standalone coins and primary source for erc20 tokens and xrp as blockbook doesn't provide fiat rates for them
                results = ticker.tokenAddress
                    ? await fetchCurrentTokenFiatRates(ticker)
                    : await fetchCurrentFiatRates(ticker);
            }

            if (results?.rates) {
                // dispatch only if rates are not null/undefined
                dispatch(
                    fiatRatesActions.updateFiatRate({
                        ticker,
                        payload: {
                            ts: results.ts * 1000,
                            rates: results.rates,
                            symbol: ticker.symbol,
                        },
                    }),
                );
            }
        } catch (error) {
            console.error(error);
        }
    },
);

/**
 * Updates current fiat rates for every stale ticker
 */
export const updateStaleFiatRatesThunk = createThunk(
    `${actionPrefix}/updateStaleRates`,
    async (_, { dispatch }) => {
        try {
            const staleTickers = await dispatch(
                getFiatStaleTickersThunk({
                    timestampFunc: ticker =>
                        ticker.current?.rates ? ticker.current.ts : undefined,
                    interval: MAX_AGE,
                    includeTokens: true,
                }),
            ).unwrap();
            const promises = staleTickers.map(t =>
                dispatch(
                    updateCurrentFiatRatesThunk({
                        ticker: t,
                        maxAge: 0,
                    }),
                ),
            );
            await Promise.all(promises);
        } catch (error) {
            // todo: dispatch some error;
            // dispatch({ type: '@rate/error', payload: error.message });
            console.error(error);
        }
    },
);

export const onUpdateFiatRateThunk = createThunk(
    `${actionPrefix}/onUpdateFiatRate`,
    (res: BlockchainFiatRatesUpdate, { dispatch }) => {
        if (!res?.rates) return;
        const symbol = res.coin.shortcut.toLowerCase();
        dispatch(
            fiatRatesActions.updateFiatRate({
                ticker: {
                    symbol,
                },
                payload: {
                    ts: getUnixTime(new Date()) * 1000,
                    rates: res.rates,
                    symbol,
                },
            }),
        );
    },
);

/**
 * Updates the price data for the past 7 days in 1-hour interval (168 data points)
 */
export const updateLastWeekFiatRatesThunk = createThunk(
    `${actionPrefix}/updateLastWeekRates`,
    async (localCurrency: FiatCurrencyCode, { dispatch }) => {
        const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));
        const timestamps = [weekAgoTimestamp];

        const lastWeekStaleFn = (coinRates: CoinFiatRates) => {
            if (coinRates.lastWeek?.tickers[0]?.rates[localCurrency]) {
                // if there is a rate for localCurrency then decide based on timestamp
                return coinRates.lastWeek?.ts;
            }
            // no rates for localCurrency
            return null;
        };

        const staleTickers = await dispatch(
            getFiatStaleTickersThunk({
                timestampFunc: lastWeekStaleFn,
                interval: MAX_AGE_LAST_WEEK,
            }),
        ).unwrap();

        const promises = staleTickers.map(async ticker => {
            const response = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
                coin: ticker.symbol,
                timestamps,
            });
            try {
                const results = response.success
                    ? response.payload
                    : await fetchLastWeekFiatRates(ticker, localCurrency);

                if (results && 'tickers' in results) {
                    dispatch(
                        fiatRatesActions.updateLastWeekFiatRates({
                            symbol: ticker.symbol,
                            tickers: results.tickers,
                            ts: new Date().getTime(),
                        }),
                    );
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log(error);
            }
        });
        await Promise.all(promises);
    },
);

/**
 *  Fetch and update fiat rates for given `txs`
 *  Primary source of rates is TrezorConnect, coingecko serves as a fallback
 *
 */
export const updateTxsFiatRatesThunk = createThunk(
    `${actionPrefix}/updateTxsRates`,
    async ({ account, txs, localCurrency }: UpdateTxsFiatRatesThunkPayload, { dispatch }) => {
        if (txs?.length === 0 || isTestnet(account.symbol)) return;

        const timestamps = txs.map(tx => getBlockbookSafeTime(tx.blockTime));
        const response = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
            coin: account.symbol,
            timestamps,
        });
        try {
            const results = response.success
                ? response.payload
                : await getFiatRatesForTimestamps(
                      { symbol: account.symbol },
                      timestamps,
                      localCurrency,
                  );

            if (results && 'tickers' in results) {
                dispatch(
                    fiatRatesActions.updateTransactionFiatRate(
                        txs.map((tx, i) => ({
                            txid: tx.txid,
                            updateObject: { rates: results.tickers[i]?.rates },
                            account,
                            ts: new Date().getTime(),
                        })),
                    ),
                );
            }
        } catch (error) {
            console.error(error);
        }
    },
);

const updateMissingTxFiatRatesThunk = createThunk(
    `${actionPrefix}/updateMissingTxRates`,
    (symbol: NetworkSymbol, { dispatch, extra, getState }) => {
        const {
            selectors: { selectLocalCurrency },
        } = extra;
        const localCurrency = selectLocalCurrency(getState());
        const transactions = selectTransactions(getState());
        const accounts = selectAccounts(getState());
        accounts.forEach(account => {
            if (symbol && account.symbol !== symbol) {
                return;
            }
            const accountTxs = getAccountTransactions(account.key, transactions);
            // fetch rates for all txs without 'rates' field
            dispatch(
                updateTxsFiatRatesThunk({
                    account,
                    txs: accountTxs.filter(tx => !tx.rates),
                    localCurrency,
                }),
            );
        });
    },
);

/**
 * Called from blockchainActions.onConnect
 *
 */
export const initFiatRatesThunk = createThunk(
    `${actionPrefix}/initRates`,
    (symbol: NetworkSymbol, { dispatch, extra, getState }) => {
        const {
            selectors: { selectLocalCurrency },
        } = extra;
        const localCurrency = selectLocalCurrency(getState());

        dispatch(updateStaleFiatRatesThunk());
        dispatch(updateLastWeekFiatRatesThunk(localCurrency));
        dispatch(updateMissingTxFiatRatesThunk(symbol)); // just to be safe, refetch historical rates for transactions stored without these rates

        if (staleRatesTimeout && lastWeekTimeout) {
            clearInterval(staleRatesTimeout);
            clearInterval(lastWeekTimeout);
        }

        staleRatesTimeout = setInterval(() => {
            dispatch(updateStaleFiatRatesThunk());
        }, INTERVAL);
        lastWeekTimeout = setInterval(() => {
            dispatch(updateLastWeekFiatRatesThunk(localCurrency));
        }, INTERVAL_LAST_WEEK);
    },
);
