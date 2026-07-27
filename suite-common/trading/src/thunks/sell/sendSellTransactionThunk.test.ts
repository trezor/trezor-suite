import { combineReducers } from '@reduxjs/toolkit';
import { type SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { accountBtc } from '../../__fixtures__/utils';
import { invityAPI } from '../../invityAPI';
import { type TradingSellState, sellInitialState } from '../../reducers/sellReducer';
import { initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { type TradingTransactionSell } from '../../types';
import { sellUtilsFixtures } from '../../utils/sell/__fixtures__/sellUtils';
import { tradingThunks } from '../common';

import { sellThunks } from './index';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

describe('sendSellTransactionThunk', () => {
    const date = new Date('2025-04-09');
    const dateISO = date.toISOString();

    beforeEach(() => {
        jest.spyOn(tradingThunks, 'recomposeAndSignTxThunk').mockImplementation(
            createThunk('@trading/thunk/recomposeAndSignTx', (_, { fulfillWithValue }) =>
                fulfillWithValue({
                    success: true,
                    payload: {
                        txid: 'txid',
                    },
                }),
            ),
        );
    });

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(date);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const getQuote = () =>
        ({
            ...sellUtilsFixtures.MIN_MAX_QUOTES_OK[0],
            orderId: 'orderId',
            cryptoStringAmount: '0.01',
            destinationAddress: 'destinationAddress',
            destinationPaymentExtraId: 'extraId',
        }) as SellFiatTrade;

    const getMocks = (initialSellState?: Partial<TradingSellState>) => {
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
                        sell: {
                            ...sellInitialState,
                            selectedQuote: getQuote(),
                            ...initialSellState,
                        },
                    },
                },
            },
        });

        const account = accountBtc as Account;
        const trade: TradingTransactionSell = {
            tradeType: 'sell' as const,
            date: new Date().toISOString(),
            key: getQuote().orderId,
            data: getQuote(),
            sendAccountKey: mockAccountKey({ descriptor: 'xxx' }),
        };
        const mockNextStep = jest.fn();

        return { store, account, trade, mockNextStep };
    };

    describe('should return error', () => {
        it.each([
            ['when trade data is undefined', { trade: undefined }],
            ['when trade data has not orderId', { trade: {} }],
            ['when trade data has not cryptoStringAmount', { trade: { orderId: 'orderId' } }],
            [
                'when trade data has not destinationAddress',
                { trade: { orderId: 'orderId', cryptoStringAmount: '1' } },
            ],
        ])('%s', async (_, tradeTest) => {
            const { store, account, mockNextStep } = getMocks();

            jest.spyOn(invityAPI, 'doSellConfirm');

            const result = await store.dispatch(
                sellThunks.sendTransactionThunk({
                    account,
                    trade: {
                        ...(tradeTest.trade as SellFiatTrade),
                    },
                    decimals: getNetwork(account.symbol).decimals,
                    shouldSendInSats: false,
                    nextStep: mockNextStep,
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );

            const tradingState = store.getState().wallet.trading;

            expect(tradingState.modalAccountKey).toBe(account.key);
            expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(0);
            expect(invityAPI.doSellConfirm).toHaveBeenCalledTimes(0);
            expect(mockNextStep).not.toHaveBeenCalled();
            expect(tradingState.trades).toEqual([]);
            expect(tradingState.sell.transactionId).toBeUndefined();
            expect(result.meta.requestStatus).toEqual('rejected');
            expect(result.payload).toEqual({
                type: 'error',
                error: {
                    id: 'TR_TRADING_CANNOT_SEND_TRANSACTION',
                },
            });
        });
    });

    describe('should return error after recompose and sign transaction', () => {
        it.each([
            ['when payload is undefined', undefined],
            ['when payload contains error', { type: 'error', error: { id: 'TR_ERROR' } }],
            ['when payload is not successful', { success: false }],
        ])('%s', async (_, recomposeAndSignPayload) => {
            const { store, account, trade, mockNextStep } = getMocks();

            jest.spyOn(tradingThunks, 'recomposeAndSignTxThunk').mockImplementation(
                createThunk(
                    '@trading/thunk/recomposeAndSignTx',
                    (_, { rejectWithValue }) =>
                        rejectWithValue(recomposeAndSignPayload as any) as unknown as Promise<any>,
                ),
            );

            jest.spyOn(invityAPI, 'doSellConfirm');

            const result = await store.dispatch(
                sellThunks.sendTransactionThunk({
                    account,
                    trade: { ...trade.data },
                    decimals: getNetwork(account.symbol).decimals,
                    shouldSendInSats: false,
                    nextStep: mockNextStep,
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );
            const tradingState = store.getState().wallet.trading;

            expect(tradingState.modalAccountKey).toBe(account.key);
            expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
            expect(invityAPI.doSellConfirm).toHaveBeenCalledTimes(0);
            expect(mockNextStep).not.toHaveBeenCalled();
            expect(tradingState.trades).toEqual([]);
            expect(tradingState.sell.transactionId).toBeUndefined();
            expect(result.meta.requestStatus).toEqual('rejected');
            expect(result.payload).toEqual(
                recomposeAndSignPayload && 'error' in recomposeAndSignPayload
                    ? recomposeAndSignPayload
                    : {
                          type: 'sign-tx-error',
                          error: {
                              id: 'TR_TRADING_CANNOT_SEND_TRANSACTION',
                          },
                      },
            );
        });
    });

    describe('should return error after request API', () => {
        it.each([
            ['when response is undefined', undefined, { id: 'TR_TRADING_NO_RESPONSE' }],
            [
                'when response error is present',
                { error: 'Error message' },
                { id: 'TR_TRADING_INVALID_RESPONSE', values: { error: '(Error message)' } },
            ],
            [
                'when response status is not filled',
                { status: undefined, orderId: 'orderId' },
                { id: 'TR_TRADING_INVALID_RESPONSE' },
            ],
            [
                'when response orderId is not filled',
                { status: 'SUBMITTED', orderId: undefined },
                { id: 'TR_TRADING_INVALID_RESPONSE' },
            ],
        ])('%s', async (_, response, error) => {
            const { store, account, trade, mockNextStep } = getMocks();

            invityAPI.doSellConfirm = () => Promise.resolve(response as unknown as SellFiatTrade);

            const result = await store.dispatch(
                sellThunks.sendTransactionThunk({
                    account,
                    trade: { ...trade.data },
                    decimals: getNetwork(account.symbol).decimals,
                    shouldSendInSats: false,
                    nextStep: mockNextStep,
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );
            const tradingState = store.getState().wallet.trading;

            expect(tradingState.modalAccountKey).toBe(account.key);
            expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
            expect(mockNextStep).not.toHaveBeenCalled();
            expect(tradingState.trades).toEqual([]);
            expect(tradingState.sell.transactionId).toBeUndefined();
            expect(result.meta.requestStatus).toEqual('rejected');
            expect(result.payload).toEqual({
                type: 'error',
                error: {
                    ...error,
                },
            });
        });
    });

    it('should send transaction, save trade and call next step', async () => {
        const { store, account, trade, mockNextStep } = getMocks();
        const responseData = {
            ...trade.data,
            error: undefined,
            status: 'SUBMITTED',
            orderId: 'orderId',
        } as SellFiatTrade;

        invityAPI.doSellConfirm = () => Promise.resolve(responseData);

        const result = await store.dispatch(
            sellThunks.sendTransactionThunk({
                account,
                trade: { ...trade.data },
                decimals: getNetwork(account.symbol).decimals,
                shouldSendInSats: false,
                nextStep: mockNextStep,
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );
        const tradingState = store.getState().wallet.trading;

        expect(tradingState.modalAccountKey).toBe(account.key);
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
        expect(tradingState.trades).toEqual([
            {
                tradeType: 'sell',
                date: dateISO,
                data: {
                    ...responseData,
                },
                key: responseData.orderId,
                sendAccountKey: accountBtc.key,
            },
        ]);
        expect(tradingState.sell.transactionId).toBe('orderId');
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(result.meta.requestStatus).toEqual('fulfilled');
    });

    it('should send transaction, save trade and call next step with shouldSendInSats true', async () => {
        const { store, account, trade, mockNextStep } = getMocks();
        const responseData = {
            ...trade.data,
            error: undefined,
            status: 'SUBMITTED',
            orderId: 'orderId',
        } as SellFiatTrade;

        invityAPI.doSellConfirm = () => Promise.resolve(responseData);

        const result = await store.dispatch(
            sellThunks.sendTransactionThunk({
                account,
                trade: { ...trade.data },
                decimals: getNetwork(account.symbol).decimals,
                shouldSendInSats: true,
                nextStep: mockNextStep,
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );
        const tradingState = store.getState().wallet.trading;
        const mockedRecomposeAndSignTxThunk =
            tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock;

        expect(tradingState.modalAccountKey).toBe(account.key);
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
        expect(mockedRecomposeAndSignTxThunk.mock.calls[0][0].amount).toBe('1000000');
        expect(tradingState.trades).toEqual([
            {
                tradeType: 'sell',
                date: dateISO,
                data: {
                    ...responseData,
                },
                key: responseData.orderId,
                sendAccountKey: accountBtc.key,
            },
        ]);
        expect(tradingState.sell.transactionId).toBe('orderId');
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(result.meta.requestStatus).toEqual('fulfilled');
    });

    it('should send transaction, save trade and call next step with fallback selectedQuote', async () => {
        const { store, account, trade, mockNextStep } = getMocks({
            selectedQuote: {
                ...getQuote(),
                exchange: undefined,
            },
        });
        const responseData = {
            ...trade.data,
            error: undefined,
            status: 'SUBMITTED',
            orderId: 'orderId',
        } as SellFiatTrade;

        invityAPI.doSellConfirm = () => Promise.resolve(responseData);

        const result = await store.dispatch(
            sellThunks.sendTransactionThunk({
                account,
                trade: undefined,
                decimals: getNetwork(account.symbol).decimals,
                shouldSendInSats: true,
                nextStep: mockNextStep,
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );
        const tradingState = store.getState().wallet.trading;
        const mockedRecomposeAndSignTxThunk =
            tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock;

        expect(tradingState.modalAccountKey).toBe(account.key);
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
        expect(mockedRecomposeAndSignTxThunk.mock.calls[0][0].amount).toBe('1000000');
        expect(tradingState.trades).toEqual([
            {
                tradeType: 'sell',
                date: dateISO,
                data: {
                    ...responseData,
                },
                key: responseData.orderId,
                sendAccountKey: accountBtc.key,
            },
        ]);
        expect(tradingState.sell.transactionId).toBe('orderId');
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(result.meta.requestStatus).toEqual('fulfilled');
    });
});
