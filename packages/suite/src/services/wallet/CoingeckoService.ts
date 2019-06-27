/* @flow */

import { httpRequest } from '@wallet-utils/networkUtils';
import { resolveAfter } from '@wallet-utils/promiseUtils';
import fiatConfig from '@suite-config/fiat';
import * as SUITE from '@suite-actions/constants/suite';
// import { READY } from 'actions/constants/localStorage';
// import * as TOKEN from 'actions/constants/token';
// import { Token } from 'reducers/TokensReducer';
import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch, GetState } from '@suite-types/index';

const BASE_URL = 'https://api.coingecko.com/';

export const RATE_UPDATE: 'rate__update' = 'rate__update';

export interface NetworkRate {
    network: string;
    rates: { [key: string]: number };
}

export interface FiatRateAction {
    type: typeof RATE_UPDATE;
    network: string;
    rates: { [key: string]: number };
}

interface CoinGeckoToken {
    name: string;
    symbol: string;
    id: string;
}

// const getSupportedCurrencies = async () => {
//     const url = 'https://api.coingecko.com/api/v3/simple/supported_vs_currencies';
//     const res = await httpRequest(url, 'json');
//     return res;
// };

const loadRateAction = () => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // const { config } = getState().localStorage;
    // if (!config) return;

    try {
        fiatConfig.tickers.forEach(async ticker => {
            const response = await httpRequest(
                `${ticker.url}?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
                'json',
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

const loadTokenRateAction = (token: { symbol: string }) => async (
    dispatch: Dispatch,
): Promise<void> => {
    try {
        const tokens = await fetchCoinList();
        const tokenData = tokens.find(
            (t: CoinGeckoToken) => t.symbol === token.symbol.toLowerCase(),
        );
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
const CoingeckoService = (api: MiddlewareAPI<Dispatch, State>) => (next: Dispatch) => (
    action: Action,
): Action => {
    next(action);

    // TODO: change to WALLET.READY
    if (action.type === SUITE.READY) {
        console.log('suite ready');
        api.dispatch(loadRateAction());
    }

    // if (action.type === TOKEN.ADD) {
    //     api.dispatch(loadTokenRateAction(action.payload));
    // }

    return action;
};

export default CoingeckoService;
