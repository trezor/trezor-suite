import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { watchTradeThunk } from './watchTradeThunk';
import { accountBtc } from '../../__fixtures__/utils';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { type TradingState, initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradeApi } from '../../tradeApi';
import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
} from '../../types';

describe('watchTradeThunk', () => {
    jest.mock('../../tradeApi');

    const tradingReducer = prepareTradingReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
    });
    const account = accountBtc as Account;
    const refreshCount = 1;

    const getStore = (updatedState: Partial<TradingState>) =>
        createTestStore({
            extra: undefined,
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
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

            tradeApi.watchTrade = () => Promise.resolve(undefined as any);

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

    it('should not update when response fields are unchanged', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'buy',
            data: {
                status: 'LOGIN_REQUEST',
                paymentId: 'tradeKey',
                fiatStringAmount: '100',
            },
        } as TradingTransactionBuy;

        const store = getStore({
            trades: [trade],
        });

        tradeApi.watchTrade = () =>
            Promise.resolve({
                status: 'LOGIN_REQUEST',
                fiatStringAmount: '100',
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

        tradeApi.watchTrade = () =>
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

    it('should clear a previously persisted error once watchTrade succeeds', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'buy',
            data: {
                status: 'ERROR',
                paymentId: 'tradeKey',
                error: 'Some error occurred',
            },
        } as TradingTransactionBuy;

        const store = getStore({
            trades: [trade],
        });

        tradeApi.watchTrade = () =>
            Promise.resolve({
                status: 'SUBMITTED',
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
                status: 'SUBMITTED',
                paymentId: 'tradeKey',
                error: undefined,
            },
            receiveAccountKey: undefined,
            selectedAccountKey: account.key,
        });
    });

    it('should update buy trade quote fields when status is unchanged', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'buy',
            data: {
                status: 'SUBMITTED',
                paymentId: 'tradeKey',
                fiatStringAmount: '100',
                receiveStringAmount: '0.001',
                rate: 100000,
                paymentMethod: 'creditCard',
                paymentMethodName: 'Credit Card',
            },
        } as TradingTransactionBuy;

        const store = getStore({
            trades: [trade],
            buy: {
                ...initialState.buy,
                selectedQuote: trade.data,
            },
        });

        tradeApi.watchTrade = () =>
            Promise.resolve({
                status: 'SUBMITTED',
                fiatStringAmount: '110',
                receiveStringAmount: '0.0011',
                rate: 100000,
                paymentMethod: 'applePay',
                paymentMethodName: 'Apple Pay',
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
        const saveSelectedQuoteAction = actions.find(
            action => action.type === tradingBuyActions.saveSelectedQuote.type,
        );

        expect(saveTradeAction?.payload).toEqual({
            tradeType: 'buy',
            date: dateISO,
            key: 'tradeKey',
            data: {
                status: 'SUBMITTED',
                paymentId: 'tradeKey',
                fiatStringAmount: '110',
                receiveStringAmount: '0.0011',
                rate: 100000,
                paymentMethod: 'applePay',
                paymentMethodName: 'Apple Pay',
            },
            receiveAccountKey: undefined,
            selectedAccountKey: account.key,
        });
        expect(saveSelectedQuoteAction?.payload).toEqual(
            (saveTradeAction?.payload as { data: unknown } | undefined)?.data,
        );
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
            [
                'when quote fields are in the response',
                {
                    fiatStringAmount: '250',
                    rate: 50000,
                    paymentMethod: 'bankTransfer',
                    paymentMethodName: 'Bank Transfer',
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
                sendAccountKey: 'sendAccountKey' as AccountKey, // Todo: create properly via `createAccountKey()`,
            } as TradingTransactionSell;

            const store = getStore({
                trades: [trade],
            });

            tradeApi.watchTrade = () =>
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

        it('should clear a stale destinationPaymentExtraId when the response omits it', async () => {
            const trade = {
                date: dateISO,
                key: 'tradeKey',
                tradeType: 'sell',
                data: {
                    status: 'SUBMITTED',
                    orderId: 'tradeKey',
                    destinationAddress: 'oldDestinationAddress',
                    destinationPaymentExtraId: 'oldDestinationPaymentExtraId',
                },
                sendAccountKey: 'sendAccountKey' as AccountKey,
            } as TradingTransactionSell;

            const store = getStore({
                trades: [trade],
            });

            tradeApi.watchTrade = () =>
                Promise.resolve({
                    status: 'SUBMITTED',
                    destinationAddress: 'newDestinationAddress',
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
                    status: 'SUBMITTED',
                    orderId: 'tradeKey',
                    destinationAddress: 'newDestinationAddress',
                    destinationPaymentExtraId: undefined,
                },
                sendAccountKey: 'sendAccountKey',
            });
        });

        it('should update selected quote when orderId matches', async () => {
            const trade = {
                date: dateISO,
                key: 'tradeKey',
                tradeType: 'sell',
                data: {
                    status: 'LOGIN_REQUEST',
                    orderId: 'tradeKey',
                    cryptoStringAmount: '0.1',
                },
                sendAccountKey: 'sendAccountKey' as AccountKey,
            } as TradingTransactionSell;

            const store = getStore({
                trades: [trade],
                sell: {
                    ...initialState.sell,
                    selectedQuote: trade.data,
                },
            });

            tradeApi.watchTrade = () =>
                Promise.resolve({
                    status: 'CONFIRM',
                    cryptoStringAmount: '0.12',
                    fiatStringAmount: '500',
                } as any);

            await store.dispatch(
                watchTradeThunk({
                    account,
                    trade,
                    refreshCount,
                }),
            );

            const actions = store.getActions();
            const saveSelectedQuoteAction = actions.find(
                action => action.type === tradingSellActions.saveSelectedQuote.type,
            );

            expect(saveSelectedQuoteAction?.payload).toEqual({
                status: 'CONFIRM',
                orderId: 'tradeKey',
                cryptoStringAmount: '0.12',
                fiatStringAmount: '500',
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
            [
                'when quote fields are in the response',
                {
                    sendStringAmount: '0.5',
                    receiveStringAmount: '100',
                    rate: 200,
                    receiveTxHash: '0xabc',
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

            tradeApi.watchTrade = () =>
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

        it('should update quote fields when status is unchanged', async () => {
            const trade = {
                date: dateISO,
                key: 'tradeKey',
                tradeType: 'exchange',
                data: {
                    status: 'CONFIRM',
                    orderId: 'tradeKey',
                    sendStringAmount: '1',
                    receiveStringAmount: '50',
                    rate: 50,
                },
                sendAccountKey: 'sendAccountKey' as AccountKey,
            } as TradingTransactionExchange;

            const store = getStore({
                trades: [trade],
                exchange: {
                    ...initialState.exchange,
                    selectedQuote: trade.data,
                },
            });

            tradeApi.watchTrade = () =>
                Promise.resolve({
                    status: 'CONFIRM',
                    sendStringAmount: '1.01',
                    receiveStringAmount: '49.5',
                    rate: 49,
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
            const saveSelectedQuoteAction = actions.find(
                action => action.type === tradingExchangeActions.saveSelectedQuote.type,
            );

            const savedTradeData = (saveTradeAction?.payload as { data: unknown } | undefined)
                ?.data;

            expect(savedTradeData).toEqual({
                status: 'CONFIRM',
                orderId: 'tradeKey',
                sendStringAmount: '1.01',
                receiveStringAmount: '49.5',
                rate: 49,
            });
            expect(saveSelectedQuoteAction?.payload).toEqual(savedTradeData);
        });
    });
});
