import { httpRequest } from '@wallet-utils/networkUtils';
import { FIAT } from '@suite-config';
import { Dispatch, GetState } from '@suite-types';
import { RATE_UPDATE, LAST_WEEK_RATES_UPDATE } from './constants/fiatRatesConstants';
import { Network } from '@wallet-types';
import { saveFiatRates } from '@suite-actions/storageActions';
import BlockchainLink from '@trezor/blockchain-link';
// import { resolveStaticPath } from '@suite-utils/nextjs';
import { CoinFiatRates, LastWeekRates } from '@wallet-reducers/fiatRateReducer';
import NETWORKS from '@wallet-config/networks';
// @ts-ignore
import BlockbookWorker from '@trezor/blockchain-link/build/web/blockbook-worker';

export type FiatRateActions =
    | {
          type: typeof RATE_UPDATE;
          payload: {
              symbol: Network['symbol'];
              rates: { [key: string]: number };
              ts: number;
          };
      }
    | {
          type: typeof LAST_WEEK_RATES_UPDATE;
          payload: {
              symbol: Network['symbol'];
              tickers: LastWeekRates['tickers'];
              ts: number;
          };
      };

// how often should suite check for outdated rates;
const INTERVAL = 1000 * 60; // 1 min
// which rates should be considered outdated and updated;
const MAX_AGE = 1000 * 60 * 10; // 10 mins
const INTERVAL_LAST_WEEK = 1000 * 60 * 60 * 4; // 4 hours

const blockchanLinks: Partial<{ [k in Network['symbol']]: BlockchainLink | undefined }> = {};
NETWORKS.forEach(network => {
    if (network.blockbook) {
        blockchanLinks[network.symbol] = new BlockchainLink({
            name: network.symbol,
            worker: BlockbookWorker,
            server: (network.blockbook as unknown) as string[],
            debug: false,
        });
    }
});

const getStaleTickers = (
    timestampFunc: (ticker: CoinFiatRates) => number | undefined,
    interval: number,
) => async (dispatch: Dispatch, getState: GetState) => {
    const { fiat } = getState().wallet;
    const { enabledNetworks } = getState().wallet.settings;
    const watchedTickers = FIAT.tickers.filter(t => enabledNetworks.includes(t.symbol));

    return watchedTickers.filter(t => {
        // if no rates loaded yet, load them;
        if (fiat.length === 0) return true;
        const alreadyWatchedTicker = fiat.find(f => f.symbol === t.symbol);
        // is not in fiat[], means is not watched, for example coin was added in settings, add it
        if (!alreadyWatchedTicker) return true;

        const timestamp = timestampFunc(alreadyWatchedTicker);
        if (!timestamp) return true;
        // otherwise load only older ones
        return Date.now() - timestamp > interval;
    });
};

export const handleRatesUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
    // get enabled networks to decide which fiat endpoints we are going to watch
    // it doesnt matter there are testnets included, as they will not be taken into account because
    // there is no counterpart for them in FIAT constant

    try {
        const staleTickers = await dispatch(getStaleTickers(ticker => ticker.current?.ts, MAX_AGE));
        const promises = staleTickers.map(async ticker => {
            try {
                const blockchainLink = blockchanLinks[ticker.symbol];
                const response = await blockchainLink?.getCurrentFiatRates({});
                if (response) {
                    dispatch({
                        type: RATE_UPDATE,
                        payload: {
                            ts: response.ts * 1000, // blockbook sends time in seconds
                            rates: response.rates,
                            symbol: ticker.symbol,
                        },
                    });
                    // save to storage
                    dispatch(saveFiatRates());
                }
            } catch (error) {
                // bla
            }
        });
        await Promise.all(promises);
    } catch (error) {
        // todo: dispatch some error;
        // dispatch({ type: '@rate/error', payload: error.message });
        console.error(error);
    }
};

export const updateLastWeekRates = () => async (dispatch: Dispatch) => {
    const day = 86400;
    const hour = 3600;
    const currentTimestamp = Math.floor(new Date().getTime() / 1000) - 120; // unix timestamp in seconds - 2 mins
    const timestamps: number[] = [];
    const weekAgoTimestamp = currentTimestamp - 7 * day;

    // calc timestamps in 4 hours intervals the last 7 days
    let timestamp = currentTimestamp;
    while (timestamp > weekAgoTimestamp) {
        timestamp -= 4 * hour;
        timestamps.push(timestamp);
    }
    // console.log('timestamps', timestamps);

    const staleTickers = await dispatch(getStaleTickers(ticker => ticker.lastWeek?.ts, MAX_AGE));

    const promises = staleTickers.map(async ticker => {
        const blockchainLink = blockchanLinks[ticker.symbol];
        if (!blockchainLink) return;
        try {
            const response = await blockchainLink.getFiatRatesForTimestamps({
                timestamps: timestamps.reverse(),
            });
            dispatch({
                type: LAST_WEEK_RATES_UPDATE,
                payload: {
                    symbol: ticker.symbol,
                    tickers: response.tickers,
                    ts: new Date().getTime(),
                },
            });
        } catch (error) {
            // bla
            console.log('updateLastWeekRates fail', error);
        }
    });
    await Promise.all(promises);

    setInterval(() => {
        dispatch(updateLastWeekRates());
    }, INTERVAL_LAST_WEEK);
};

export const initRates = () => (dispatch: Dispatch) => {
    dispatch(handleRatesUpdate());
    dispatch(updateLastWeekRates());
    // todo: might be nice to implement canceling interval but later...
    setInterval(() => {
        dispatch(handleRatesUpdate());
    }, INTERVAL);
};
