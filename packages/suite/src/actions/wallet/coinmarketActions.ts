import { ExchangeCoinInfo } from '@suite/services/invityAPI/exchangeTypes';
import { BuyListResponse, BuyProviderInfo } from '@suite/services/invityAPI/buyTypes';
import invityAPI from '@suite/services/invityAPI/service';
import { COINMARKET } from './constants';
import { Dispatch } from '@suite-types';

export interface BuyInfo {
    coins: ExchangeCoinInfo[];
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
}

export type CoinmarketActions =
    | { type: typeof COINMARKET.SAVE_BUY_INFO; buyInfo: BuyListResponse }
    | { type: typeof COINMARKET.SAVE_OFFERS; offers: any }; // todo type

export async function loadBuyInfo(): Promise<{
    coins: ExchangeCoinInfo[];
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
}> {
    let [buyInfo, coins] = await Promise.all([
        invityAPI.getBuyList(),
        invityAPI.getExchangeCoins(),
    ]);

    if (!buyInfo) {
        buyInfo = { country: 'unknown', providers: [] };
    }

    if (!buyInfo.providers) {
        buyInfo.providers = [];
    }

    if (!coins) {
        coins = [];
    }

    const providerInfos: { [name: string]: BuyProviderInfo } = {};

    buyInfo.providers.forEach(e => (providerInfos[e.name] = e));

    return {
        coins,
        buyInfo,
        providerInfos,
    };
}

export const saveBuyInfo = (buyInfo: BuyListResponse) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET.SAVE_BUY_INFO,
        buyInfo,
    });
};

export const saveOffers = (offers: any) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET.SAVE_OFFERS,
        offers,
    });
};
