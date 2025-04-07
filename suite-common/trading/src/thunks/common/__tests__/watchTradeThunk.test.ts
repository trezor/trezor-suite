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
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
} from '../../../types';
import { watchTradeThunk } from '../watchTradeThunk';

describe('watchTradeThunk', () => {
    jest.mock('../../../invityAPI');

    const tradingReducer = prepareTradingReducer(extraDependenciesMock);
    const account = accountBtc as Account;
    const accountData = {
        symbol: account.symbol,
        descriptor: account.descriptor,
        accountIndex: account.index,
        accountType: account.accountType,
    };
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

    it('should remain in the same status when there is not any response', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'buy',
            data: {
                status: 'LOGIN_REQUEST',
                paymentId: 'tradeKey',
            },
            account: accountData,
        } as TradingTransactionBuy;

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

    it('should remain in the status when there is same the status in response', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'buy',
            data: {
                status: 'LOGIN_REQUEST',
                paymentId: 'tradeKey',
            },
            account: accountData,
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
            account: accountData,
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
            account: accountData,
            data: {
                status: 'ERROR',
                paymentId: 'tradeKey',
                error: 'Some error occurred',
            },
        });
    });

    it('should skip update sell trade data', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'sell',
            data: {
                status: 'LOGIN_REQUEST',
                paymentId: 'tradeKey',
            },
            account: accountData,
        } as TradingTransactionSell;

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

        expect(saveTradeAction).toBeUndefined();
    });

    it('should skip update exchange trade data', async () => {
        const trade = {
            date: dateISO,
            key: 'tradeKey',
            tradeType: 'exchange',
            data: {
                status: 'SENDING',
                paymentId: 'tradeKey',
            },
            account: accountData,
        } as TradingTransactionExchange;

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

        expect(saveTradeAction).toBeUndefined();
    });
});
