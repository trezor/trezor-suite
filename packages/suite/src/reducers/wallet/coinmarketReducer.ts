import produce from 'immer';
import { WalletAction } from '@wallet-types';
import { BuyListResponse } from '@suite/services/invityAPI/buyTypes';
import { COINMARKET } from '@wallet-actions/constants';

interface State {
    buyInfo: BuyListResponse | null;
    offers: any; // todo type
}

const initialState = {
    buyInfo: null,
    offers: [],
};

export default (state: State = initialState, action: WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case COINMARKET.SAVE_BUY_INFO:
                draft.buyInfo = action.buyInfo;
                break;
            case COINMARKET.SAVE_OFFERS:
                draft.offers = action.offers;
                break;
            // no default
        }
    });
};
