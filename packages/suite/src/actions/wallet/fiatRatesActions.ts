import TrezorConnect, { AccountTransaction, BlockchainFiatRatesUpdate } from 'trezor-connect';
import { getUnixTime, subWeeks, differenceInSeconds } from 'date-fns';
import {
    fetchCurrentFiatRates,
    getFiatRatesForTimestamps,
    fetchLastWeekRates,
    fetchCurrentTokenFiatRates,
} from '@suite/services/coingecko';
import { isTestnet } from '@wallet-utils/accountUtils';
import { getBlockbookSafeTime } from '@suite-utils/date';
import { FIAT } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import { Dispatch, GetState } from '@suite-types';
import {
    RATE_UPDATE,
    LAST_WEEK_RATES_UPDATE,
    TX_FIAT_RATE_UPDATE,
    RATE_REMOVE,
} from './constants/fiatRatesConstants';
import { Network, Account, CoinFiatRates, WalletAccountTransaction, TickerId } from '@wallet-types';

type FiatRatesPayload = NonNullable<CoinFiatRates['current']>;

export type FiatRatesAction =
    | {
          type: typeof RATE_UPDATE;
          ticker: TickerId;
          payload: FiatRatesPayload;
      }
    | {
          type: typeof RATE_REMOVE;
          payload: TickerId;
      }
    | {
          type: typeof TX_FIAT_RATE_UPDATE;
          payload: {
              txid: string;
              account: Account;
              updateObject: Partial<WalletAccountTransaction>;
              ts: number;
          }[];
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

export const remove = (ticker: TickerId): FiatRatesAction => ({
    type: RATE_REMOVE,
    payload: ticker,
});

export const removeRatesForDisabledNetworks = () => (dispatch: Dispatch, getState: GetState) => {
    const { enabledNetworks } = getState().wallet.settings;
    const fiat = getState().wallet.fiat.coins;
    fiat.forEach(f => {
        const rateNetwork = (f.mainNetworkSymbol ?? f.symbol) as Network['symbol'];
        if (!enabledNetworks.includes(rateNetwork)) {
            dispatch(remove(f));
        }
    });
};

/**
 * Fetch and update current fiat rates for a given ticker
 * Primary source of rates is TrezorConnect, coingecko serves as a fallback
 *
 * @param {TickerId} ticker
 * @param {number} [maxAge=MAX_AGE]
 */
export const updateCurrentRates = (ticker: TickerId, maxAge = MAX_AGE) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const network = NETWORKS.find(t =>
        ticker.tokenAddress ? t.symbol === ticker.mainNetworkSymbol : t.symbol === ticker.symbol,
    );
    // skip testnets
    if (!network || network.testnet) return;

    if (maxAge > 0) {
        const existingRates = getState().wallet.fiat.coins.find(
            t =>
                t.symbol === ticker.symbol &&
                t.tokenAddress === ticker.tokenAddress &&
                t.mainNetworkSymbol === ticker.mainNetworkSymbol,
        )?.current;

        // don't fetch if rates is fresh enough
        if (existingRates) {
            if (differenceInSeconds(new Date(), new Date(existingRates.ts)) < maxAge) {
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
            dispatch({
                type: RATE_UPDATE,
                ticker,
                payload: {
                    ts: results.ts * 1000,
                    rates: results.rates,
                    symbol: ticker.symbol,
                },
            });
        }
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
) => (_dispatch: Dispatch, getState: GetState): TickerId[] => {
    const fiat = getState().wallet.fiat.coins;
    const {
        settings: { enabledNetworks },
        blockchain,
    } = getState().wallet;
    // TODO: FIAT.tickers is useless now
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
        const promises = staleTickers.map(t => dispatch(updateCurrentRates(t, 0)));
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

    const staleTickers = dispatch(getStaleTickers(lastWeekStaleFn, MAX_AGE_LAST_WEEK));

    const promises = staleTickers.map(async ticker => {
        const response = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
            coin: ticker.symbol,
            timestamps,
        });
        try {
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

    const timestamps = txs.map(tx => tx.blockTime ?? getBlockbookSafeTime());
    const response = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
        coin: account.symbol,
        timestamps,
    });
    try {
        const results = response.success
            ? response.payload
            : await getFiatRatesForTimestamps({ symbol: account.symbol }, timestamps);

        if (results?.tickers) {
            dispatch({
                type: TX_FIAT_RATE_UPDATE,
                payload: txs.map((tx, i) => ({
                    txid: tx.txid,
                    updateObject: { rates: results.tickers[i]?.rates },
                    account,
                    ts: new Date().getTime(),
                })),
            });
        }
    } catch (error) {
        console.error(error);
    }
};

export const onUpdateRate = (res: BlockchainFiatRatesUpdate) => (dispatch: Dispatch) => {
    if (!res?.rates) return;
    const symbol = res.coin.shortcut.toLowerCase();
    dispatch({
        type: RATE_UPDATE,
        ticker: {
            symbol,
        },
        payload: {
            ts: getUnixTime(new Date()) * 1000,
            rates: res.rates,
            symbol,
        },
    });
};

let staleRatesTimeout: ReturnType<typeof setInterval>;
let lastWeekTimeout: ReturnType<typeof setInterval>;
/**
 * Called from blockchainActions.onConnect
 *
 */
export const initRates = () => (dispatch: Dispatch) => {
    dispatch(updateStaleRates());
    dispatch(updateLastWeekRates());

    if (staleRatesTimeout && lastWeekTimeout) {
        clearInterval(staleRatesTimeout);
        clearInterval(lastWeekTimeout);
    }

    staleRatesTimeout = setInterval(() => {
        dispatch(updateStaleRates());
    }, INTERVAL);
    lastWeekTimeout = setInterval(() => {
        dispatch(updateLastWeekRates());
    }, INTERVAL_LAST_WEEK);
};
