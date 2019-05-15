/* @flow */

import { httpRequest } from 'utils/networkUtils';
import { resolveAfter } from 'utils/promiseUtils';
import { READY } from 'actions/constants/localStorage';
import * as TOKEN from 'actions/constants/token';
import type { Token } from 'reducers/TokensReducer';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Dispatch,
    Action,
    AsyncAction,
    GetState,
} from 'flowtype';

const BASE_URL = 'https://api.coingecko.com/';

export const RATE_UPDATE: 'rate__update' = 'rate__update';

export type NetworkRate = {
    network: string,
    rates: { [string]: number },
};

export type FiatRateAction = {
    type: typeof RATE_UPDATE,
    network: string,
    rates: { [string]: number },
};

// const getSupportedCurrencies = async () => {
//     const url = 'https://api.coingecko.com/api/v3/simple/supported_vs_currencies';
//     const res = await httpRequest(url, 'json');
//     return res;
// };

const loadRateAction = (): AsyncAction => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const { config } = getState().localStorage;
    if (!config) return;

    try {
        config.fiatValueTickers.forEach(async ticker => {
            const response = await httpRequest(
                `${
                    ticker.url
                }?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
                'json'
            );
            if (response) {
                dispatch({
                    type: RATE_UPDATE,
                    network: response.symbol,
                    rates: response.market_data.current_price,
                });
            }
        });
    } catch (error) {
        // ignore error
        console.error(error);
    }

    await resolveAfter(50000);
};

const fetchCoinRate = async (id: string): Promise<any> => {
    const url = new URL(`/api/v3/coins/${id}`, BASE_URL);
    url.searchParams.set('tickers', 'false');
    url.searchParams.set('market_data', 'true');
    url.searchParams.set('community_data', 'false');
    url.searchParams.set('developer_data', 'false');
    url.searchParams.set('sparkline', 'false');

    const response = await fetch(url.toString());
    const rates = await response.json();
    return rates;
};

const fetchCoinList = async (): Promise<any> => {
    const url = new URL('/api/v3/coins/list', BASE_URL);

    const response = await fetch(url.toString());
    const tokens = await response.json();
    return tokens;
};

const loadTokenRateAction = (token: Token): AsyncAction => async (
    dispatch: Dispatch
): Promise<void> => {
    const { symbol } = token;
    try {
        const tokens = await fetchCoinList();
        const tokenData = tokens.find(t => t.symbol === symbol.toLowerCase());
        if (!tokenData) return;

        const res = await fetchCoinRate(tokenData.id);
        if (res) {
            dispatch({
                type: RATE_UPDATE,
                network: res.symbol,
                rates: res.market_data.current_price,
            });
        }
    } catch (err) {
        console.log(err);
    }
};

/**
 * Middleware
 */
const CoingeckoService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (
    action: Action
): Action => {
    next(action);

    if (action.type === READY) {
        api.dispatch(loadRateAction());
    }

    if (action.type === TOKEN.ADD) {
        api.dispatch(loadTokenRateAction(action.payload));
    }

    return action;
};

export default CoingeckoService;
