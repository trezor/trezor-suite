import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';

import { clearTradingStateThunk } from '../thunks';

describe('thunks', () => {
    const dispatch = jest.fn();
    const getState = jest.fn();
    const extra = {} as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('clearTradingStateThunk', () => {
        it('should clear last error message for all trade types', async () => {
            const thunk = clearTradingStateThunk();
            await thunk(dispatch, getState, extra);

            expect(dispatch).toHaveBeenCalledWith(
                tradingSellActions.setLastErrorMessage(undefined),
            );
            expect(dispatch).toHaveBeenCalledWith(
                tradingExchangeActions.setLastErrorMessage(undefined),
            );
            expect(dispatch).toHaveBeenCalledWith(tradingBuyActions.setLastErrorMessage(undefined));
        });
    });
});
