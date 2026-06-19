import { type TradingType } from '../../../types';
import { type ResolvedTradeError } from '../../../utils/exchange/resolveExchangeTradeError';
import { logErrorThunk } from '../logErrorThunk';

jest.mock('@suite-common/toast-notifications', () => {
    const originalModule = jest.requireActual('@suite-common/toast-notifications');

    return {
        ...originalModule,
        notificationsActions: {
            ...originalModule.notificationsActions,
            addToast: jest.fn().mockImplementation(toast => ({
                type: 'mockedAddToastAction',
                payload: toast,
            })),
        },
    };
});

jest.mock('../setLastErrorMessageByTradingType', () => {
    const originalModule = jest.requireActual('../setLastErrorMessageByTradingType');

    return {
        ...originalModule,
        setLastErrorMessageByTradingType: jest
            .fn()
            .mockImplementation(({ tradingType, errorMessage }) => ({
                type: 'mockedSetLastErrorMessageByTradingTypeAction',
                payload: { tradingType, errorMessage },
            })),
    };
});

describe('logErrorThunk', () => {
    const dispatch = jest.fn();
    const getState = () => {};
    const extra = {} as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call addToast', async () => {
        const errorMessage = 'Test error message';
        const tradingType = 'buy';

        const thunk = logErrorThunk({
            errorMessage,
            tradingType,
        });
        await thunk(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith({
            type: 'mockedAddToastAction',
            payload: {
                type: 'error',
                error: errorMessage,
            },
        });
    });

    it('should call addToast with specified type', async () => {
        const errorMessage = 'Test error message';
        const tradingType = 'buy';
        const toastType = 'discovery-error';

        const thunk = logErrorThunk({
            errorMessage,
            tradingType,
            toastType,
        });
        await thunk(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith({
            type: 'mockedAddToastAction',
            payload: {
                type: toastType,
                error: errorMessage,
            },
        });
    });

    it('should set last error message', async () => {
        const errorMessage = 'Test error message';
        const tradingType: TradingType = 'buy';

        const thunk = logErrorThunk({
            errorMessage,
            tradingType,
        });
        await thunk(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith({
            type: 'mockedSetLastErrorMessageByTradingTypeAction',
            payload: { errorMessage: 'Test error message', tradingType: 'buy' },
        });
    });

    it('should add a trading-error toast for a resolved trade error', async () => {
        const errorMessage: ResolvedTradeError = {
            code: 'invalid_pair',
            values: { send: 'BTC', receive: 'ETH' },
            message: 'Invalid currency',
        };
        const tradingType: TradingType = 'buy';

        const thunk = logErrorThunk({
            errorMessage,
            tradingType,
        });
        await thunk(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith({
            type: 'mockedAddToastAction',
            payload: {
                type: 'trading-error',
                errorCode: 'invalid_pair',
                values: { send: 'BTC', receive: 'ETH' },
                message: 'Invalid currency',
            },
        });
    });

    it('should set the resolved message as the last error message', async () => {
        const errorMessage: ResolvedTradeError = {
            code: 'invalid_pair',
            values: { send: 'BTC', receive: 'ETH' },
            message: 'Invalid currency',
        };
        const tradingType: TradingType = 'buy';

        const thunk = logErrorThunk({
            errorMessage,
            tradingType,
        });
        await thunk(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith({
            type: 'mockedSetLastErrorMessageByTradingTypeAction',
            payload: { errorMessage: 'Invalid currency', tradingType: 'buy' },
        });
    });

    it('should default the last error message to an empty string when the resolved error has no message', async () => {
        const errorMessage: ResolvedTradeError = { code: 'unknown' };
        const tradingType: TradingType = 'buy';

        const thunk = logErrorThunk({
            errorMessage,
            tradingType,
        });
        await thunk(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith({
            type: 'mockedSetLastErrorMessageByTradingTypeAction',
            payload: { errorMessage: '', tradingType: 'buy' },
        });
    });
});
