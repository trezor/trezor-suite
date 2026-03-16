import { combineReducers } from '@reduxjs/toolkit';
import { type BuyTradeResponse } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/buyUtils';
import { invityAPI } from '../../../invityAPI';
import { type TradingBuyState } from '../../../reducers/buyReducer';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import type { LogErrorThunkProps } from '../../common/logErrorThunk';
import { buyThunks } from '../index';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

jest.mock('../../common/logErrorThunk', () => ({
    logErrorThunk: (props: LogErrorThunkProps) => ({
        type: 'mockedLogErrorThunk',
        payload: props,
    }),
}));

describe('confirmBuyTradeThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getMocks = (initialBuyState?: Partial<TradingBuyState>) => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        buy: {
                            ...initialState.buy,
                            selectedQuote: MIN_MAX_QUOTES_OK[1],
                            ...(initialBuyState ?? {}),
                            receiveAccountKey: 'xxx',
                        },
                    },
                },
            },
        });

        const mockProcessResponseData = jest.fn();
        const mocktriggerAnalyticsTradeConfirmation = jest.fn();

        const tradeForm = {
            form: {
                formMethod: 'GET' as const,
                formAction: 'action',
                formTarget: '_blank' as const,
                fields: {
                    key: 'string',
                },
            },
        };

        return {
            store,
            mockProcessResponseData,
            mocktriggerAnalyticsTradeConfirmation,
            tradeForm,
        };
    };

    it('should not trigger any action if selectedQuote is not set', async () => {
        const { store, mockProcessResponseData, mocktriggerAnalyticsTradeConfirmation } = getMocks({
            selectedQuote: undefined,
        });

        await store.dispatch(
            buyThunks.confirmTradeThunk({
                returnUrl: 'returnUrl',
                address: 'address',
                account: {
                    symbol: 'btc',
                    accountType: 'normal',
                    descriptor: 'desc',
                    index: 1,
                } as Account,
                triggerAnalyticsTradeConfirmation: mocktriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        expect(store.getActions().length).toEqual(2);
        expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
        expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(0);
        expect(store.getState().wallet.trading.buy.isLoading).toBeFalsy();
    });

    describe('should show error toast', () => {
        it('if there is no response', async () => {
            const { store, mockProcessResponseData, mocktriggerAnalyticsTradeConfirmation } =
                getMocks();

            invityAPI.doBuyTrade = () => Promise.resolve(undefined as unknown as BuyTradeResponse);

            await store.dispatch(
                buyThunks.confirmTradeThunk({
                    returnUrl: 'returnUrl',
                    address: 'address',
                    account: {
                        symbol: 'btc',
                        accountType: 'normal',
                        descriptor: 'desc',
                        index: 1,
                    } as Account,
                    triggerAnalyticsTradeConfirmation: mocktriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            );

            const toastAction = store
                .getActions()
                .find(action => action.type === 'mockedLogErrorThunk');

            expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(toastAction?.payload).toEqual({
                tradingType: 'buy',
                errorMessage: 'No response from the server',
            });
            expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.isLoading).toBeFalsy();
        });

        it('if there is no trade in response', async () => {
            const { store, mockProcessResponseData, mocktriggerAnalyticsTradeConfirmation } =
                getMocks();

            invityAPI.doBuyTrade = () => Promise.resolve({} as BuyTradeResponse);

            await store.dispatch(
                buyThunks.confirmTradeThunk({
                    returnUrl: 'returnUrl',
                    address: 'address',
                    account: {
                        symbol: 'btc',
                        accountType: 'normal',
                        descriptor: 'desc',
                        index: 1,
                    } as Account,
                    triggerAnalyticsTradeConfirmation: mocktriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            );

            const toastAction = store
                .getActions()
                .find(action => action.type === 'mockedLogErrorThunk');

            expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(toastAction?.payload).toEqual({
                tradingType: 'buy',
                errorMessage: 'No response from the server',
            });
            expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.isLoading).toBeFalsy();
        });

        it('if there is no response trade payment id', async () => {
            const { store, mockProcessResponseData, mocktriggerAnalyticsTradeConfirmation } =
                getMocks();

            invityAPI.doBuyTrade = () =>
                Promise.resolve({
                    trade: {
                        ...MIN_MAX_QUOTES_OK[1],
                        paymentId: undefined,
                    },
                });

            await store.dispatch(
                buyThunks.confirmTradeThunk({
                    returnUrl: 'returnUrl',
                    address: 'address',
                    account: {
                        symbol: 'btc',
                        accountType: 'normal',
                        descriptor: 'desc',
                        index: 1,
                    } as Account,
                    triggerAnalyticsTradeConfirmation: mocktriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            );

            const toastAction = store
                .getActions()
                .find(action => action.type === 'mockedLogErrorThunk');

            expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(toastAction?.payload).toEqual({
                tradingType: 'buy',
                errorMessage: 'No response from the server',
            });
            expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.isLoading).toBeFalsy();
        });

        it('if there is trade error', async () => {
            const { store, mockProcessResponseData, mocktriggerAnalyticsTradeConfirmation } =
                getMocks();
            const error = 'Error message from API';

            invityAPI.doBuyTrade = () =>
                Promise.resolve({
                    trade: {
                        ...MIN_MAX_QUOTES_OK[1],
                        error,
                    },
                });

            await store.dispatch(
                buyThunks.confirmTradeThunk({
                    returnUrl: 'returnUrl',
                    address: 'address',
                    account: {
                        symbol: 'btc',
                        accountType: 'normal',
                        descriptor: 'desc',
                        index: 1,
                    } as Account,
                    triggerAnalyticsTradeConfirmation: mocktriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            );

            const toastAction = store
                .getActions()
                .find(action => action.type === 'mockedLogErrorThunk');
            expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(toastAction?.payload).toEqual({
                tradingType: 'buy',
                errorMessage: error,
            });
            expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.isLoading).toBeFalsy();
        });
    });

    it('should call processResponseData with successful response and save trade', async () => {
        const { store, mockProcessResponseData, mocktriggerAnalyticsTradeConfirmation } =
            getMocks();

        const dateString = new Date().toISOString();
        jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

        invityAPI.doBuyTrade = () =>
            Promise.resolve({
                trade: {
                    ...MIN_MAX_QUOTES_OK[1],
                },
            });

        await store.dispatch(
            buyThunks.confirmTradeThunk({
                returnUrl: 'returnUrl',
                address: 'address',
                account: {
                    key: 'yyy' as AccountKey, // Todo: create properly via `createAccountKey()`
                } as Account,
                triggerAnalyticsTradeConfirmation: mocktriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        const { trades } = store.getState().wallet.trading;

        expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(mockProcessResponseData).toHaveBeenCalledTimes(1);
        expect(trades.length).toEqual(1);
        expect(trades[0]).toEqual({
            tradeType: 'buy',
            date: dateString,
            data: MIN_MAX_QUOTES_OK[1],
            key: MIN_MAX_QUOTES_OK[1].paymentId,
            receiveAccountKey: 'xxx',
            selectedAccountKey: 'yyy',
        });
        expect(store.getState().wallet.trading.buy.isLoading).toBeFalsy();
    });
});
