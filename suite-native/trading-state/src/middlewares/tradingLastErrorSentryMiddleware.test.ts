import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';

import { prepareTradingLastErrorSentryMiddleware } from './tradingLastErrorSentryMiddleware';

const mockCaptureSentryException = jest.fn();

jest.mock('@suite-native/sentry', () => ({
    captureSentryException: (...args: unknown[]) => mockCaptureSentryException(...args),
}));

describe('tradingLastErrorSentryMiddleware', () => {
    const tradingLastErrorSentryMiddleware = prepareTradingLastErrorSentryMiddleware(() => ({}));
    const next = jest.fn(a => a);
    const dispatch = jest.fn();
    const getState = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should do nothing on general action', () => {
        const action = { type: 'GENERAL_ACTION' };
        const ret = tradingLastErrorSentryMiddleware({ dispatch, getState })(next)(action);

        expect(ret).toBe(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(action);
        expect(mockCaptureSentryException).not.toHaveBeenCalled();
    });

    it.each([
        ['buy', tradingBuyActions.setLastErrorMessage('Error message')],
        ['exchange', tradingExchangeActions.setLastErrorMessage('Error message')],
        ['sell', tradingSellActions.setLastErrorMessage('Error message')],
    ])('should capture last error message for %s trading type', (_, action) => {
        const ret = tradingLastErrorSentryMiddleware({ dispatch, getState })(next)(action);

        expect(ret).toBe(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(action);
        expect(mockCaptureSentryException).toHaveBeenCalledTimes(1);
        expect(mockCaptureSentryException).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Error message',
                name: 'TradingError',
            }),
        );
    });

    it.each([
        ['buy', tradingBuyActions.setLastErrorMessage(undefined)],
        ['exchange', tradingExchangeActions.setLastErrorMessage(undefined)],
        ['sell', tradingSellActions.setLastErrorMessage(undefined)],
    ])('should ignore empty last error message for %s trading type', (_, action) => {
        const ret = tradingLastErrorSentryMiddleware({ dispatch, getState })(next)(action);

        expect(ret).toBe(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(action);
        expect(mockCaptureSentryException).not.toHaveBeenCalled();
    });
});
