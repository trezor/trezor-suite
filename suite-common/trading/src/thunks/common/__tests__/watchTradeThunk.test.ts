import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import {
    TradingState,
    initialState,
    prepareTradingReducer,
} from '../../../reducers/tradingReducer';
import {
    TradingTransaction,
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
} from '../../../types';
import { watchTradeThunk } from '../watchTradeThunk';

describe('watchTradeThunk', () => {
    jest.mock('../../../invityAPI');

    const tradingReducer = prepareTradingReducer(extraDependenciesMock);
    const account = accountBtc as Account;
    const refreshCount = 1;

    const getStore = (updatedState: Partial<TradingState>) =>
        configureMockStore({
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
                        ...updatedState,
                    },
                },
            },
        });

    const date = new Date('2025-04-09');
    const dateISO = date.toISOString();

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(date);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('should not update trade when there is not any response', () => {
        it.each([['buy'], ['sell'], ['exchange']])('watch %s', async tradeType => {
            const trade = {
                date: dateISO,
                key: 'tradeKey',
                tradeType,
                data: {
                    status: 'LOGIN_REQUEST',
                    paymentId: 'tradeKey',
                },
            } as TradingTransaction;

            const store = getStore({
                trades: [trade],
            });

            invityAPI.watchTrade = () => Promise.resolve(undefined as any);

            await store.dispatch(
                watchTradeThunk({
                    account,
                    trade,
                    refreshCount,
                }),
            );

            const actions = store.getActions();
            const saveTradeAction = actions.find(action => action.type === '@trading/saveTrade');

            expect(saveTradeAction).toBeUndefined();
        });
    });

    it('should remain in the status when there is same the status in response', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'buy',
            data: {
                status: 'LOGIN_REQUEST',
                paymentId: 'tradeKey',
            },
        } as TradingTransactionBuy;

        const store = getStore({
            trades: [trade],
        });

        invityAPI.watchTrade = () =>
            Promise.resolve({
                status: 'LOGIN_REQUEST',
            } as any);

        await store.dispatch(
            watchTradeThunk({
                account,
                trade,
                refreshCount,
            }),
        );

        const actions = store.getActions();
        const saveTradeAction = actions.find(action => action.type === '@trading/saveTrade');

        expect(saveTradeAction).toBeUndefined();
    });

    it('should update buy trade status and error', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'buy',
            data: {
                status: 'LOGIN_REQUEST',
                paymentId: 'tradeKey',
            },
        } as TradingTransactionBuy;

        const store = getStore({
            trades: [trade],
        });

        invityAPI.watchTrade = () =>
            Promise.resolve({
                status: 'ERROR',
                error: 'Some error occurred',
            } as any);

        await store.dispatch(
            watchTradeThunk({
                account,
                trade,
                refreshCount,
            }),
        );

        const actions = store.getActions();
        const saveTradeAction = actions.find(action => action.type === '@trading/saveTrade');

        expect(saveTradeAction?.payload).toEqual({
            tradeType: 'buy',
            date: dateISO,
            key: 'tradeKey',
            data: {
                status: 'ERROR',
                paymentId: 'tradeKey',
                error: 'Some error occurred',
            },
            receiveAccountKey: undefined,
            selectedAccountKey: account.key,
        });
    });

    describe('should update sell trade data', () => {
        it.each([
            [
                'when destinationAddress is in the response',
                {
                    destinationAddress: 'destinationAddress',
                    destinationPaymentExtraId: 'destinationPaymentExtraId',
                },
            ],
            [
                'when cryptoStringAmount is in the response',
                {
                    cryptoStringAmount: 'cryptoStringAmount',
                },
            ],
            ['when neither destinationAddress nor cryptoStringAmount is not in the response', {}],
        ])('watch %s', async (_, responseData) => {
            const trade = {
                date: dateISO,
                key: 'tradeKey',
                tradeType: 'sell',
                data: {
                    status: 'LOGIN_REQUEST',
                    orderId: 'tradeKey',
                },
                sendAccountKey: 'sendAccountKey',
            } as TradingTransactionSell;

            const store = getStore({
                trades: [trade],
            });

            invityAPI.watchTrade = () =>
                Promise.resolve({
                    status: 'CONFIRM',
                    ...responseData,
                } as any);

            await store.dispatch(
                watchTradeThunk({
                    account,
                    trade,
                    refreshCount,
                }),
            );

            const actions = store.getActions();
            const saveTradeAction = actions.find(action => action.type === '@trading/saveTrade');

            expect(saveTradeAction?.payload).toEqual({
                tradeType: 'sell',
                date: dateISO,
                key: 'tradeKey',
                data: {
                    status: 'CONFIRM',
                    orderId: 'tradeKey',
                    ...responseData,
                },
                sendAccountKey: 'sendAccountKey',
            });
        });
    });

    describe('should update exchange trade data', () => {
        it.each([
            [
                'when sendAddress is in the response',
                {
                    sendAddress: 'sendAddress',
                    partnerPaymentExtraId: 'partnerPaymentExtraId',
                },
            ],
            ['when sendAddress is not in the response', {}],
        ])('watch %s', async (_, responseData) => {
            const trade = {
                date: dateISO,
                key: 'tradeKey',
                tradeType: 'exchange',
                data: {
                    status: 'SENDING',
                    orderId: 'tradeKey',
                },
            } as TradingTransactionExchange;

            const store = getStore({
                trades: [trade],
            });

            invityAPI.watchTrade = () =>
                Promise.resolve({
                    status: 'CONFIRM',
                    ...responseData,
                } as any);

            await store.dispatch(
                watchTradeThunk({
                    account,
                    trade,
                    refreshCount,
                }),
            );

            const actions = store.getActions();
            const saveTradeAction = actions.find(action => action.type === '@trading/saveTrade');

            expect(saveTradeAction?.payload).toEqual({
                tradeType: 'exchange',
                date: dateISO,
                key: 'tradeKey',
                data: {
                    status: 'CONFIRM',
                    orderId: 'tradeKey',
                    ...responseData,
                },
            });
        });
    });
});
