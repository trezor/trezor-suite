import { SellListResponse } from 'invity-api';
import invityAPI from '@suite-services/invityAPI';
import { COINMARKET_SELL } from './constants';

export interface SellInfo {
    sellList?: SellListResponse;
}

export type CoinmarketSellAction =
    | { type: typeof COINMARKET_SELL.SAVE_SELL_INFO; sellInfo: SellInfo }
    | { type: typeof COINMARKET_SELL.SHOW_LEAVE_MODAL; showLeaveModal: boolean };

export const loadSellInfo = async (): Promise<SellInfo> => {
    const sellList = await invityAPI.getSellList();
    return {
        sellList,
    };
};

export const saveSellInfo = (sellInfo: SellInfo): CoinmarketSellAction => ({
    type: COINMARKET_SELL.SAVE_SELL_INFO,
    sellInfo,
});

export const setShowLeaveModal = (showLeaveModal: boolean): CoinmarketSellAction => ({
    type: COINMARKET_SELL.SHOW_LEAVE_MODAL,
    showLeaveModal,
});
