import TrezorConnect, { AccountTransaction, BlockchainFiatRatesUpdate } from 'trezor-connect';
import { subWeeks, getUnixTime } from 'date-fns';
import {
    fetchCurrentFiatRates,
    getFiatRatesForTimestamps,
    fetchLastWeekRates,
} from '@suite/services/coingecko';
import { isTestnet } from '@wallet-utils/accountUtils';
import { splitTimestampsByInterval } from '@suite-utils/date';
import { FIAT } from '@suite-config';
import { Dispatch, GetState } from '@suite-types';
import {
    RATE_UPDATE,
    LAST_WEEK_RATES_UPDATE,
    TX_FIAT_RATE_UPDATE,
    RATE_REMOVE,
} from './constants/fiatRatesConstants';
import {
    Network,
    Account,
    CoinFiatRates,
    WalletAccountTransaction,
    FiatTicker,
} from '@wallet-types';

type FiatRatesPayload = NonNullable<CoinFiatRates['current']>;

export type FiatRateActions =
    | {
          type: typeof RATE_UPDATE;
          payload: FiatRatesPayload;
          mainNetworkSymbol?: string;
      }
    | {
          type: typeof RATE_REMOVE;
          symbol: string;
          mainNetworkSymbol?: string;
      }
    | {
          type: typeof TX_FIAT_RATE_UPDATE;
          payload: {
              txid: string;
              account: Account;
              updateObject: Partial<WalletAccountTransaction>;
              ts: number;
          };
      }
    | {
          type: typeof LAST_WEEK_RATES_UPDATE;
          payload: {
              symbol: Network['symbol'] | string;
              tickers: NonNullable<CoinFiatRates['lastWeek']>['tickers'];
              ts: number;
          };
      };

// how often should suite check for outdated rates;
const INTERVAL = 1000 * 60; // 1 min
const INTERVAL_LAST_WEEK = 1000 * 60 * 60 * 1; // 1 hour
// which rates should be considered outdated and updated;
const MAX_AGE = 1000 * 60 * 10; // 10 mins
const MAX_AGE_LAST_WEEK = 1000 * 60 * 60 * 1; // 1 hour

export const remove = (symbol: string, mainNetworkSymbol?: string) => (dispatch: Dispatch) => {
    dispatch({
        type: RATE_REMOVE,
        symbol,
        mainNetworkSymbol,
    });
};

export const removeRatesForDisabledNetworks = () => (dispatch: Dispatch, getState: GetState) => {
    const { enabledNetworks } = getState().wallet.settings;
    const { fiat } = getState().wallet;
    fiat.forEach(f => {
        const rateNetwork = (f.mainNetworkSymbol ?? f.symbol) as Network['symbol'];
        if (!enabledNetworks.includes(rateNetwork)) {
            dispatch(remove(f.symbol, f.mainNetworkSymbol));
        }
    });
};

/**
 * Fetch and update current fiat rates for a given ticker
 * Primary source of rates is TrezorConnect, coingecko serves as a fallback
 *
 * @param {FiatTicker} ticker
 */
export const updateCurrentRates = (ticker: FiatTicker) => async (
    dispatch: Dispatch,
    _getState: GetState,
) => {
    try {
        const response = await TrezorConnect.blockchainGetCurrentFiatRates({ coin: ticker.symbol });
        const results = response.success ? response.payload : await fetchCurrentFiatRates(ticker);

        if (results && results.rates) {
            // dispatch only if rates are not null/undefined
            dispatch({
                type: RATE_UPDATE,
                mainNetworkSymbol: ticker.mainNetworkSymbol,
                payload: {
                    ts: results.ts * 1000,
                    rates: results.rates,
                    symbol: ticker.symbol,
                },
            });
        }
        return results;
    } catch (error) {
        console.error(error);
    }
};

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
 * @param {((ticker: CoinFiatRates) => number | undefined)} timestampFunc
 * @param {number} interval
 * @param {boolean} [includeTokens]
 */
const getStaleTickers = (
    timestampFunc: (ticker: CoinFiatRates) => number | undefined | null,
    interval: number,
    includeTokens?: boolean,
) => (_dispatch: Dispatch, getState: GetState): FiatTicker[] => {
    const { fiat } = getState().wallet;
    const { enabledNetworks } = getState().wallet.settings;
    const watchedCoinTickers = FIAT.tickers.filter(t => enabledNetworks.includes(t.symbol));
    const tokenTickers = fiat.filter(t => !!t.mainNetworkSymbol);

    const needUpdateFn = (t: FiatTicker) => {
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

    const tickersToUpdate: FiatTicker[] = [];
    watchedCoinTickers.filter(needUpdateFn).forEach(t => tickersToUpdate.push(t));
    if (includeTokens) {
        tokenTickers.filter(needUpdateFn).forEach(t => tickersToUpdate.push(t));
    }

    return tickersToUpdate;
};

/**
 * Updates current fiat rates for every stale ticker
 */
export const updateStaleRates = () => async (dispatch: Dispatch, _getState: GetState) => {
    try {
        const staleTickers = dispatch(
            getStaleTickers(
                ticker => (ticker.current?.rates ? ticker.current.ts : undefined),
                MAX_AGE,
                true,
            ),
        );
        const promises = staleTickers.map(t => dispatch(updateCurrentRates(t)));
        await Promise.all(promises);
    } catch (error) {
        // todo: dispatch some error;
        // dispatch({ type: '@rate/error', payload: error.message });
        console.error(error);
    }
};

/**
 * Updates the price data for the past 7 days in 1-hour interval (168 data points)
 */
export const updateLastWeekRates = () => async (dispatch: Dispatch, getState: GetState) => {
    const { localCurrency } = getState().wallet.settings;

    const currentTimestamp = Math.floor(new Date().getTime() / 1000) - 120; // unix timestamp in seconds - 2 mins
    const weekAgoTimestamp = currentTimestamp - 7 * 86400;

    // calc timestamps in 1 hour intervals the last 7 days
    const timestamps = splitTimestampsByInterval(weekAgoTimestamp, currentTimestamp, 3600, true);

    const lastWeekStaleFn = (coinRates: CoinFiatRates) => {
        if (coinRates.lastWeek?.tickers[0]?.rates[localCurrency]) {
            // if there is a rate for localCurrency then decided based on timestamp
            return coinRates.lastWeek?.ts;
        }
        // no rates for localCurrency
        return null;
    };

    const staleTickers = dispatch(getStaleTickers(lastWeekStaleFn, MAX_AGE_LAST_WEEK));

    const promises = staleTickers.map(async ticker => {
        try {
            const response = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
                coin: ticker.symbol,
                timestamps,
            });
            const results = response.success
                ? response.payload
                : await fetchLastWeekRates(ticker, localCurrency);

            if (results?.tickers) {
                dispatch({
                    type: LAST_WEEK_RATES_UPDATE,
                    payload: {
                        symbol: ticker.symbol,
                        tickers: results.tickers,
                        ts: new Date().getTime(),
                    },
                });
            }
        } catch (error) {
            console.log(error);
        }
    });
    await Promise.all(promises);
};

/**
 *  Fetch and update fiat rates for given `txs`
 *  Primary source of rates is TrezorConnect, coingecko serves as a fallback
 *
 * @param {Account} account
 * @param {AccountTransaction[]} txs
 */
export const updateTxsRates = (account: Account, txs: AccountTransaction[]) => async (
    dispatch: Dispatch,
) => {
    if (txs?.length === 0 || isTestnet(account.symbol)) return;

    const timestamps = txs.map(tx => tx.blockTime ?? new Date().getTime());
    try {
        const response = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
            coin: account.symbol,
            timestamps,
        });

        const results = response.success
            ? response.payload
            : await getFiatRatesForTimestamps({ symbol: account.symbol }, timestamps);

        if (results?.tickers) {
            txs.forEach((tx, i) => {
                dispatch({
                    type: TX_FIAT_RATE_UPDATE,
                    payload: {
                        txid: tx.txid,
                        updateObject: { rates: results.tickers[i]?.rates },
                        account,
                        ts: new Date().getTime(),
                    },
                });
            });
        }
    } catch (error) {
        console.error(error);
    }
};

/**
 * Fetch the account history (received, sent amounts, num of txs) for the given interval
 * Returned data are grouped by month (weeks >= 52) or by day (weeks < 52)
 * No XRP support
 *
 * @param {Account} account
 * @param {number} weeks
 * @returns
 */
export const fetchAccountHistory = async (account: Account, weeks: number) => {
    const secondsInDay = 3600 * 24;
    const secondsInMonth = secondsInDay * 30;

    const startDate = subWeeks(new Date(), weeks);
    const endDate = new Date();
    try {
        const response =
            (await TrezorConnect.blockchainGetAccountBalanceHistory({
                coin: account.symbol,
                descriptor: account.descriptor,
                from: Math.floor(startDate.getTime() / 1000),
                to: Math.floor(endDate.getTime() / 1000),
                groupBy: weeks >= 52 ? secondsInMonth : secondsInDay,
            })) ?? null;

        if (response?.success) {
            return response.payload;
        }
        return null;
    } catch (error) {
        console.error(error);
    }
};

export const onUpdateRate = (res: BlockchainFiatRatesUpdate) => async (dispatch: Dispatch) => {
    if (!res?.rates) return;
    dispatch({
        type: RATE_UPDATE,
        payload: {
            ts: getUnixTime(new Date()) * 1000,
            rates: res.rates,
            symbol: res.coin.shortcut.toLowerCase(),
        },
    });
};

export const initRates = () => (dispatch: Dispatch) => {
    dispatch(updateStaleRates());
    dispatch(updateLastWeekRates());
    // todo: might be nice to implement canceling interval but later...
    setInterval(() => {
        dispatch(updateStaleRates());
    }, INTERVAL);
    setInterval(() => {
        dispatch(updateLastWeekRates());
    }, INTERVAL_LAST_WEEK);
};
