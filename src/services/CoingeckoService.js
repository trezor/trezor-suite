/* @flow */

import { httpRequest } from 'utils/networkUtils';
import { resolveAfter } from 'utils/promiseUtils';
import { READY } from 'actions/constants/localStorage';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Dispatch,
    Action,
    AsyncAction,
    GetState,
} from 'flowtype';

export const RATE_UPDATE: 'rate__update' = 'rate__update';

export type FiatRateAction = {
    type: typeof RATE_UPDATE;
    network: string;
    rate: number;
}

const loadRateAction = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { config } = getState().localStorage;
    if (!config) return;

    try {
        config.fiatValueTickers.forEach(async (ticker) => {
            const response = await httpRequest(`${ticker.url}?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`, 'json');
            if (response) {
                dispatch({
                    type: RATE_UPDATE,
                    network: response.symbol,
                    rate: response.market_data.current_price.usd,
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
const CoingeckoService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    next(action);

    if (action.type === READY) {
        api.dispatch(loadRateAction());
    }

    return action;
};

export default CoingeckoService;