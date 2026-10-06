import { type ActionCreator } from '@reduxjs/toolkit';

import { setLastErrorMessageByTradingTypeThunk } from './setLastErrorMessageByTradingType';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { type TradingType } from '../../types';

describe('setLastErrorMessageByTradingType', () => {
    const dispatch = jest.fn();
    const getState = () => {};
    const extra = {} as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each<[TradingType, ActionCreator<any>]>([
        ['buy', tradingBuyActions.setLastErrorMessage],
        ['sell', tradingSellActions.setLastErrorMessage],
        ['exchange', tradingExchangeActions.setLastErrorMessage],
    ])('should set last error message for %s', async (tradingType, expectedAction) => {
        const errorMessage = 'Test error message';

        const thunk = setLastErrorMessageByTradingTypeThunk({
            errorMessage,
            tradingType,
        });
        await thunk(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith(expectedAction(errorMessage));
    });
});
