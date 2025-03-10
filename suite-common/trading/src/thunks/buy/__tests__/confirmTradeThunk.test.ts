import { combineReducers } from '@reduxjs/toolkit';
import { BuyTradeResponse } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/buyUtils';
import { invityAPI } from '../../../invityAPI';
import { TradingBuyState } from '../../../reducers/buyReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { confirmTradeThunk } from '../confirmTradeThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('confirmTradeThunk', () => {
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
                    tradingNew: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    tradingNew: {
                        ...initialState,
                        buy: {
                            ...initialState.buy,
                            selectedQuote: MIN_MAX_QUOTES_OK[1],
                            ...(initialBuyState ?? {}),
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
            confirmTradeThunk({
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
        expect(store.getState().wallet.tradingNew.buy.isLoading).toBeFalsy();
    });

    describe('should show error toast', () => {
        it('if there is no response', async () => {
            const { store, mockProcessResponseData, mocktriggerAnalyticsTradeConfirmation } =
                getMocks();

            invityAPI.doBuyTrade = () => Promise.resolve(undefined as unknown as BuyTradeResponse);

            await store.dispatch(
                confirmTradeThunk({
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
                .find(action => action.type === '@common/in-app-notifications/addToast');

            expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(toastAction?.payload.type).toEqual('error');
            expect(toastAction?.payload.error).toEqual('No response from the server');
            expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.buy.isLoading).toBeFalsy();
        });

        it('if there is no trade in response', async () => {
            const { store, mockProcessResponseData, mocktriggerAnalyticsTradeConfirmation } =
                getMocks();

            invityAPI.doBuyTrade = () => Promise.resolve({} as BuyTradeResponse);

            await store.dispatch(
                confirmTradeThunk({
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
                .find(action => action.type === '@common/in-app-notifications/addToast');

            expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(toastAction?.payload.type).toEqual('error');
            expect(toastAction?.payload.error).toEqual('No response from the server');
            expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.buy.isLoading).toBeFalsy();
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
                confirmTradeThunk({
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
                .find(action => action.type === '@common/in-app-notifications/addToast');

            expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(toastAction?.payload.type).toEqual('error');
            expect(toastAction?.payload.error).toEqual('No response from the server');
            expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.buy.isLoading).toBeFalsy();
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
                confirmTradeThunk({
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
                .find(action => action.type === '@common/in-app-notifications/addToast');
            expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(toastAction?.payload.type).toEqual('error');
            expect(toastAction?.payload.error).toEqual(error);
            expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.buy.isLoading).toBeFalsy();
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
            confirmTradeThunk({
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

        const { trades } = store.getState().wallet.tradingNew;

        expect(mocktriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(mockProcessResponseData).toHaveBeenCalledTimes(1);
        expect(trades.length).toEqual(1);
        expect(trades[0]).toEqual({
            tradeType: 'buy',
            date: dateString,
            data: MIN_MAX_QUOTES_OK[1],
            key: MIN_MAX_QUOTES_OK[1].paymentId,
            account: {
                descriptor: 'desc',
                symbol: 'btc',
                accountType: 'normal',
                accountIndex: 1,
            },
        });
        expect(store.getState().wallet.tradingNew.buy.isLoading).toBeFalsy();
    });
});
