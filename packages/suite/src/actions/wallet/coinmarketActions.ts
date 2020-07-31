import {
    BuyListResponse,
    BuyProviderInfo,
    BuyTradeQuoteRequest,
    BuyTrade,
} from '@suite/services/invityAPI/buyTypes';
import invityAPI from '@suite/services/invityAPI/service';
import { COINMARKET } from './constants';
import { Dispatch } from '@suite-types';
import regional from '@suite/constants/wallet/coinmarket/regional';

export interface BuyInfo {
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
}

export type CoinmarketActions =
    | { type: typeof COINMARKET.SAVE_BUY_INFO; buyInfo: BuyInfo }
    | { type: typeof COINMARKET.SAVE_BUY_QUOTE_REQUEST; request: BuyTradeQuoteRequest }
    | { type: typeof COINMARKET.SAVE_BUY_QUOTES; quotes: BuyTrade[] }; // todo type

export async function loadBuyInfo(): Promise<BuyInfo> {
    let buyInfo = await invityAPI.getBuyList();

    if (!buyInfo) {
        buyInfo = { country: regional.unknownCountry, providers: [] };
    }

    if (!buyInfo.providers) {
        buyInfo.providers = [];
    }

    const providerInfos: { [name: string]: BuyProviderInfo } = {};

    buyInfo.providers.forEach(e => (providerInfos[e.name] = e));

    // TODO - add to BuyInfo fields supported fiat and crypto currencies and available countries (use getAvailableOptions from invity.io)

    return {
        buyInfo,
        providerInfos,
    };
}

export const saveBuyInfo = (buyInfo: BuyInfo) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET.SAVE_BUY_INFO,
        buyInfo,
    });
};

export const saveBuyQuoteRequest = (request: BuyTradeQuoteRequest) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET.SAVE_BUY_QUOTE_REQUEST,
        request,
    });
};

export const saveBuyQuotes = (quotes: BuyTrade[]) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET.SAVE_BUY_QUOTES,
        quotes,
    });
};
