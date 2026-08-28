import { createThunk } from '@suite-common/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { type TradingTradeBuySellType } from '../../types';

export type ClearQuotesAndParamsByTradingTypeThunkProps = {
    tradingType: TradingTradeBuySellType;
};

export const clearQuotesAndParamsByTradingTypeThunk = createThunk<
    void,
    ClearQuotesAndParamsByTradingTypeThunkProps,
    void
>(
    `${TRADING_THUNK_PREFIX}/clearQuotesAndParamsByTradingType`,
    ({ tradingType }: ClearQuotesAndParamsByTradingTypeThunkProps, { dispatch }) => {
        switch (tradingType) {
            case 'buy':
                dispatch(tradingBuyActions.clearQuotesAndParams());
                break;

            case 'sell':
                dispatch(tradingSellActions.clearQuotesAndParams());
                break;

            default:
                return exhaustive(tradingType);
        }
    },
);
