/* @flow */


import { JSONRequest, httpRequest } from '../utils/networkUtils';
import { resolveAfter } from '../utils/promiseUtils';
import { READY } from '../actions/constants/localStorage';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    State,
    Dispatch,
    Action,
    AsyncAction,
    GetState,
} from '~/flowtype';
import type { Config, FiatValueTicker } from '../reducers/LocalStorageReducer';

export const RATE_UPDATE: 'rate__update' = 'rate__update';

export type FiatRateAction = {
    type: typeof RATE_UPDATE;
    network: string;
    rate: any;
}

const loadRateAction = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const config: ?Config = getState().localStorage.config;
    if (!config) return;

    try {
        config.fiatValueTickers.forEach(async (ticker: FiatValueTicker) => {
            // const rate: ?Array<any> = await JSONRequest(`${ticker.url}?convert=USD`, 'json');
            const rate: ?Array<any> = await httpRequest(`${ticker.url}?convert=USD`, 'json');
            if (rate) {
                dispatch({
                    type: RATE_UPDATE,
                    network: ticker.network,
                    rate: rate[0],
                });
            }
        });
    } catch (error) {
        // ignore error
    }

    await resolveAfter(50000);
};

/**
 * Middleware
 */
const CoinmarketcapService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    next(action);

    if (action.type === READY) {
        api.dispatch(loadRateAction());
    }

    return action;
};

export default CoinmarketcapService;