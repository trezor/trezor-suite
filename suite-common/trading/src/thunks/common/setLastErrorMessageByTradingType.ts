import { createThunk } from '@suite-common/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { type TradingType } from '../../types';

export type SetLastErrorMessageByTradingTypeProps = {
    tradingType: TradingType;
    errorMessage: string | undefined;
};

export const setLastErrorMessageByTradingType = createThunk(
    `${TRADING_THUNK_PREFIX}/setLastErrorMessageByTradingType`,
    ({ tradingType, errorMessage }: SetLastErrorMessageByTradingTypeProps, { dispatch }) => {
        switch (tradingType) {
            case 'buy':
                dispatch(tradingBuyActions.setLastErrorMessage(errorMessage));
                break;

            case 'sell':
                dispatch(tradingSellActions.setLastErrorMessage(errorMessage));
                break;

            case 'exchange':
                dispatch(tradingExchangeActions.setLastErrorMessage(errorMessage));
                break;

            default:
                return exhaustive(tradingType);
        }
    },
);
