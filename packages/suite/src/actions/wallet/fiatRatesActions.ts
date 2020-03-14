import { FIAT } from '@suite-config';
import { Dispatch, GetState } from '@suite-types';
import {
    RATE_UPDATE,
    LAST_WEEK_RATES_UPDATE,
    TX_FIAT_RATE_UPDATE,
} from './constants/fiatRatesConstants';
import { Network, Account } from '@wallet-types';
import BlockchainLink from '@trezor/blockchain-link';
import { CoinFiatRates, LastWeekRates } from '@wallet-reducers/fiatRateReducer';
import NETWORKS from '@wallet-config/networks';
// @ts-ignore
import BlockbookWorker from '@trezor/blockchain-link/build/web/blockbook-worker';
import TrezorConnect, { AccountTransaction } from 'trezor-connect';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { subWeeks, getUnixTime } from 'date-fns';
import { fetchCurrentFiatRates, getFiatRatesForTimestamps } from '@suite/services/coingecko';
import { isTestnet } from '@suite/utils/wallet/accountUtils';

// TODO:
// Switching off network -> remove rates?, unsubscribe
// Remove blockchain link dep (try catch around connect methods with coingecko as a fallback)
// TS types in connect

type Ticker = {
    symbol: string;
    url?: string;
};

type FiatRatesPayload = NonNullable<CoinFiatRates['current']>;

export type FiatRateActions =
    | {
          type: typeof RATE_UPDATE;
          payload: FiatRatesPayload;
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
              tickers: LastWeekRates['tickers'];
              ts: number;
          };
      };

// how often should suite check for outdated rates;
const INTERVAL = 1000 * 60; // 1 min
// which rates should be considered outdated and updated;
const MAX_AGE = 1000 * 60 * 10; // 10 mins
const INTERVAL_LAST_WEEK = 1000 * 60 * 60 * 4; // 4 hours

const blockchainLinks: Partial<{ [k: string]: BlockchainLink | undefined }> = {};
NETWORKS.forEach(network => {
    if (network.blockbook) {
        blockchainLinks[network.symbol] = new BlockchainLink({
            name: network.symbol,
            worker: BlockbookWorker,
            server: (network.blockbook as unknown) as string[],
            debug: false,
        });
    }
});

export const updateRate = (
    ts: FiatRatesPayload['ts'],
    rates: FiatRatesPayload['rates'],
    symbol: FiatRatesPayload['symbol'],
) => ({
    type: RATE_UPDATE,
    payload: {
        ts,
        rates,
        symbol,
    },
});

/**
 * Fetch and update current fiat rates for given ticker
 * Sends the request to Blockbook server if the coin is supported, otherwise it uses CoinGecko
 *
 * @param {Ticker} ticker
 */
export const updateCurrentRates = (ticker: Ticker) => async (
    dispatch: Dispatch,
    _getState: GetState,
) => {
    try {
        const blockchainLink = blockchainLinks[ticker.symbol];
        // const param = ticker.url ? { url: ticker.url } : { symbol: ticker.symbol };
        const response = blockchainLink
            ? (await TrezorConnect.blockchainGetCurrentFiatRates({ coin: ticker.symbol }))?.payload
            : await fetchCurrentFiatRates(ticker);

        if (response && response.rates) {
            // dispatch only if rates are not null/undefined
            dispatch(updateRate(response.ts * 1000, response.rates, ticker.symbol));
        }
        return response;
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
    timestampFunc: (ticker: CoinFiatRates) => number | undefined,
    interval: number,
    includeTokens?: boolean,
) => (_dispatch: Dispatch, getState: GetState): Ticker[] => {
    const { fiat } = getState().wallet;
    const { enabledNetworks } = getState().wallet.settings;
    const watchedTickers = FIAT.tickers.filter(t => enabledNetworks.includes(t.symbol));

    const listOfWatchedSymbols: string[] = FIAT.tickers.map(t => t.symbol);
    // all tickers that are inside reducer and not listed in FIAT.tickers (in file) => probably tokens!
    const tokenTickers = fiat.filter(t => !listOfWatchedSymbols.includes(t.symbol));

    const needUpdateFn = (t: Ticker) => {
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

    const tickersToUpdate: Ticker[] = [];
    watchedTickers.filter(needUpdateFn).forEach(t => tickersToUpdate.push(t));
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
 * Updates the price data for the past 7 days in 4-hour interval (42 data points)
 */
const updateLastWeekRates = () => async (dispatch: Dispatch) => {
    const day = 86400;
    const hour = 3600;
    const currentTimestamp = Math.floor(new Date().getTime() / 1000) - 120; // unix timestamp in seconds - 2 mins
    let timestamps: number[] = [];
    const weekAgoTimestamp = currentTimestamp - 7 * day;

    // calc timestamps in 4 hours intervals the last 7 days
    let timestamp = currentTimestamp;
    while (timestamp > weekAgoTimestamp) {
        timestamp -= 4 * hour;
        timestamps.push(timestamp);
    }
    timestamps = timestamps.reverse();

    const staleTickers = dispatch(getStaleTickers(ticker => ticker.lastWeek?.ts, MAX_AGE));

    const promises = staleTickers.map(async ticker => {
        try {
            const blockchainLink = blockchainLinks[ticker.symbol];
            const response = blockchainLink
                ? (
                      await TrezorConnect.blockchainGetFiatRatesForTimestamps({
                          coin: ticker.symbol,
                          timestamps,
                      })
                  )?.payload
                : await getFiatRatesForTimestamps(ticker.symbol, timestamps);

            if (response?.tickers) {
                dispatch({
                    type: LAST_WEEK_RATES_UPDATE,
                    payload: {
                        symbol: ticker.symbol,
                        tickers: response.tickers,
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
 *  Sends the request to Blockbook server if the coin is supported, otherwise it uses CoinGecko
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
        const blockchainLink = blockchainLinks[account.symbol as Network['symbol']];
        const response = blockchainLink
            ? (
                  await TrezorConnect.blockchainGetFiatRatesForTimestamps({
                      coin: account.symbol,
                      timestamps,
                  })
              )?.payload
            : await getFiatRatesForTimestamps(account.symbol, timestamps);
        if (response?.tickers) {
            txs.forEach((tx, i) => {
                dispatch({
                    type: TX_FIAT_RATE_UPDATE,
                    payload: {
                        txid: tx.txid,
                        updateObject: { rates: response.tickers[i]?.rates },
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
 *
 * @param {Account} account
 * @param {number} weeks
 * @returns
 */
export const fetchAccountHistory = async (account: Account, weeks: number) => {
    // TODO: move out of actions?
    const secondsInDay = 3600 * 24;
    const secondsInMonth = secondsInDay * 30;

    const startDate = subWeeks(new Date(), weeks);
    const endDate = new Date();
    try {
        const blockchainLink = blockchainLinks[account.symbol as Network['symbol']];
        const response = blockchainLink
            ? await TrezorConnect.blockchainGetAccountBalanceHistory({
                  coin: account.symbol,
                  descriptor: account.descriptor,
                  from: Math.floor(startDate.getTime() / 1000),
                  to: Math.floor(endDate.getTime() / 1000),
                  groupBy: weeks >= 52 ? secondsInMonth : secondsInDay,
              })
            : null;

        if (response?.success) {
            return response.payload;
        }
        return null;
    } catch (error) {
        console.error(error);
    }
};

export const onUpdateRate = (res: any) => async (dispatch: Dispatch) => {
    console.log('onUpdateRate', res);
    if (!res?.rates) return;
    dispatch(
        updateRate(getUnixTime(new Date()) * 1000, res.rates, res.coin.shortcut.toLowerCase()),
    );
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
