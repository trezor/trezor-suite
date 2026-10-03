import { createThunk } from '@suite-common/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { type TradingType } from '../../types';

export type ClearQuotesAndParamsByTradingTypeThunkProps = {
    tradingType: TradingType;
};

export const clearQuotesAndParamsByTradingTypeThunk = createThunk<
    void,
    ClearQuotesAndParamsByTradingTypeThunkProps,
    void
>(`${TRADING_THUNK_PREFIX}/clearQuotesAndParamsByTradingType`, ({ tradingType }, { dispatch }) => {
    switch (tradingType) {
        case 'buy':
            dispatch(tradingBuyActions.clearQuotesAndParams());
            break;

        case 'sell':
            dispatch(tradingSellActions.clearQuotesAndParams());
            break;

        case 'exchange':
            dispatch(tradingExchangeActions.clearQuotesAndParams());
            break;

        default:
            return exhaustive(tradingType);
    }
});
