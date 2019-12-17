import { httpRequest } from '@wallet-utils/networkUtils';
import { FIAT } from '@suite-config';
import { Dispatch, GetState } from '@suite-types';
import { RATE_UPDATE } from './constants/fiatRatesConstants';
import { Network } from '@wallet-types';
import { saveFiatRates } from '@suite-actions/storageActions';

export type FiatRateActions = {
    type: typeof RATE_UPDATE;
    payload: {
        symbol: Network['symbol'];
        rates: { [key: string]: number };
        timestamp: number;
    };
};

// how often should suite check for outdated rates;
const INTERVAL = 1000 * 60;
// which rates should be considered outdated and updated;
const MAX_AGE = 1000 * 6 * 10;

export const handleRatesUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
    const { fiat } = getState().wallet;
    // get enabled networks to decide which fiat endpoints we are going to watch
    // it doesnt matter there are testnets included, as they will not be taken into account because
    // there is no counterpart for them in FIAT constant
    const { enabledNetworks } = getState().wallet.settings;
    const watchedTickers = FIAT.tickers.filter(t => enabledNetworks.includes(t.symbol));

    try {
        const promises = watchedTickers
            .filter(t => {
                // if no rates loaded yet, load them;
                if (fiat.length === 0) return true;
                const watchedTicker = fiat.find(f => f.symbol === t.symbol);
                // is not in fiat[], means is not watched, for example coin was added in settings, add it
                if (!watchedTicker) return true;
                // otherwise load only older ones
                return Date.now() - watchedTicker.timestamp > MAX_AGE;
            })
            .map(async ticker => {
                const response = await httpRequest(
                    `${ticker.url}?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
                    'json',
                );
                if (response) {
                    dispatch({
                        type: RATE_UPDATE,
                        payload: {
                            symbol: response.symbol,
                            rates: response.market_data.current_price,
                            timestamp: Date.now(),
                        },
                    });
                    // save to storage
                    dispatch(saveFiatRates());
                }
            });
        await Promise.all(promises);
    } catch (error) {
        // todo: dispatch some error;
        // dispatch({ type: '@rate/error', payload: error.message });
        console.error(error);
    }
};

export const initRates = () => (dispatch: Dispatch) => {
    dispatch(handleRatesUpdate());
    // todo: might be nice to implement canceling interval but later...
    setInterval(() => {
        dispatch(handleRatesUpdate());
    }, INTERVAL);
};
