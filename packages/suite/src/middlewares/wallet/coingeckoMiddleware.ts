import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { httpRequest } from '@wallet-utils/networkUtils';
import { resolveAfter } from '@wallet-utils/promiseUtils';
import { FIAT } from '@suite-config';
import { AppState, Action, Dispatch } from '@suite-types';

export const RATE_UPDATE = '@rate/update';

export interface NetworkRate {
    symbol: string;
    rates: { [key: string]: number };
}

export interface FiatRateActions {
    type: typeof RATE_UPDATE;
    symbol: string;
    rates: { [key: string]: number };
}

const loadRateAction = () => async (dispatch: Dispatch): Promise<void> => {
    // const { config } = getState().localStorage;
    // if (!config) return;

    try {
        FIAT.tickers.forEach(async ticker => {
            const response = await httpRequest(
                `${ticker.url}?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
                'json',
            );
            if (response) {
                dispatch({
                    type: RATE_UPDATE,
                    symbol: response.symbol,
                    rates: response.market_data.current_price,
                });
            }
        });
    } catch (error) {
        console.error(error);
    }

    await resolveAfter(50000);
};

const coingeckoMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    // TODO: change to WALLET.READY
    if (action.type === SUITE.READY) {
        api.dispatch(loadRateAction());
    }

    // if (action.type === TOKEN.ADD) {
    //     api.dispatch(loadTokenRateAction(action.payload));
    // }
    return action;
};

export default coingeckoMiddleware;

// ----- old CoingeckoService

// const BASE_URL = 'https://api.coingecko.com/';

// interface CoinGeckoToken {
//     name: string;
//     symbol: string;
//     id: string;
// }

// const getSupportedCurrencies = async () => {
//     const url = 'https://api.coingecko.com/api/v3/simple/supported_vs_currencies';
//     const res = await httpRequest(url, 'json');
//     return res;
// };

// const fetchCoinRate = async (id: string): Promise<any> => {
//     const url = new URL(`/api/v3/coins/${id}`, BASE_URL);
//     url.searchParams.set('tickers', 'false');
//     url.searchParams.set('market_data', 'true');
//     url.searchParams.set('community_data', 'false');
//     url.searchParams.set('developer_data', 'false');
//     url.searchParams.set('sparkline', 'false');

//     const response = await fetch(url.toString());
//     const rates = await response.json();
//     return rates;
// };

// const fetchCoinList = async (): Promise<any> => {
//     const url = new URL('/api/v3/coins/list', BASE_URL);

//     const response = await fetch(url.toString());
//     const tokens = await response.json();
//     return tokens;
// };

// const loadTokenRateAction = (token: { symbol: string }) => async (
//     dispatch: Dispatch,
// ): Promise<void> => {
//     try {
//         const tokens = await fetchCoinList();
//         const tokenData = tokens.find(
//             (t: CoinGeckoToken) => t.symbol === token.symbol.toLowerCase(),
//         );
//         if (!tokenData) return;

//         const res = await fetchCoinRate(tokenData.id);
//         if (res) {
//             dispatch({
//                 type: RATE_UPDATE,
//                 network: res.symbol,
//                 rates: res.market_data.current_price,
//             });
//         }
//     } catch (err) {
//         console.log(err);
//     }
// };
