import { combineReducers } from '@reduxjs/toolkit';
import { SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

import { sellThunks, tradingThunks } from '../../';
import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { TradingSellState, sellInitialState } from '../../../reducers/sellReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { TradingSellFormProps, TradingTransactionSell } from '../../../types';
import { sellUtilsFixtures } from '../../../utils/sell/__fixtures__/sellUtils';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

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
                    tradingNew: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    tradingNew: {
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
            sendAccountKey: 'xxx',
        };
        const mockNextStep = jest.fn();
        const formValues = {
            setMaxOutputId: undefined,
        } as TradingSellFormProps;

        return { store, account, trade, formValues, mockNextStep };
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
            const { store, account, formValues, mockNextStep } = getMocks();

            jest.spyOn(invityAPI, 'doSellConfirm');

            const result = await store.dispatch(
                sellThunks.sendTransactionThunk({
                    account,
                    trade: {
                        ...(tradeTest.trade as SellFiatTrade),
                    },
                    decimals: getNetwork(account.symbol).decimals,
                    shouldSendInSats: false,
                    formValues,
                    nextStep: mockNextStep,
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );

            const tradingState = store.getState().wallet.tradingNew;

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
            const { store, account, formValues, trade, mockNextStep } = getMocks();

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
                    formValues,
                    nextStep: mockNextStep,
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );
            const tradingState = store.getState().wallet.tradingNew;

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
            const { store, account, formValues, trade, mockNextStep } = getMocks();

            invityAPI.doSellConfirm = () => Promise.resolve(response as unknown as SellFiatTrade);

            const result = await store.dispatch(
                sellThunks.sendTransactionThunk({
                    account,
                    trade: { ...trade.data },
                    decimals: getNetwork(account.symbol).decimals,
                    shouldSendInSats: false,
                    formValues,
                    nextStep: mockNextStep,
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );
            const tradingState = store.getState().wallet.tradingNew;

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
        const { store, account, formValues, trade, mockNextStep } = getMocks();
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
                formValues,
                nextStep: mockNextStep,
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );
        const tradingState = store.getState().wallet.tradingNew;

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
                sendAccountKey: 'btc-descriptor-btc',
            },
        ]);
        expect(tradingState.sell.transactionId).toBe('orderId');
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(result.meta.requestStatus).toEqual('fulfilled');
    });

    it('should send transaction, save trade and call next step with shouldSendInSats true', async () => {
        const { store, account, formValues, trade, mockNextStep } = getMocks();
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
                formValues,
                nextStep: mockNextStep,
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );
        const tradingState = store.getState().wallet.tradingNew;
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
                sendAccountKey: 'btc-descriptor-btc',
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
            sellInfo: {
                providerInfos: {
                    cexdirect: {
                        lockSendAmount: false,
                    },
                },
            } as any,
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
                formValues: {
                    setMaxOutputId: 0,
                } as TradingSellFormProps,
                nextStep: mockNextStep,
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );
        const tradingState = store.getState().wallet.tradingNew;
        const mockedRecomposeAndSignTxThunk =
            tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock;

        expect(tradingState.modalAccountKey).toBe(account.key);
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
        expect(mockedRecomposeAndSignTxThunk.mock.calls[0][0].amount).toBe('1000000');
        expect(mockedRecomposeAndSignTxThunk.mock.calls[0][0].setMaxOutputId).toBe(0);
        expect(tradingState.trades).toEqual([
            {
                tradeType: 'sell',
                date: dateISO,
                data: {
                    ...responseData,
                },
                key: responseData.orderId,
                sendAccountKey: 'btc-descriptor-btc',
            },
        ]);
        expect(tradingState.sell.transactionId).toBe('orderId');
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(result.meta.requestStatus).toEqual('fulfilled');
    });

    it('should send transaction, save trade and call next step with fallback selectedQuote with set lockSendAmount', async () => {
        const { store, account, trade, formValues, mockNextStep } = getMocks({
            selectedQuote: getQuote(),
            sellInfo: {
                providerInfos: {
                    cexdirect: {
                        lockSendAmount: true,
                    },
                },
            } as any,
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
                formValues,
                nextStep: mockNextStep,
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );
        const tradingState = store.getState().wallet.tradingNew;
        const mockedRecomposeAndSignTxThunk =
            tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock;

        expect(tradingState.modalAccountKey).toBe(account.key);
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
        expect(mockedRecomposeAndSignTxThunk.mock.calls[0][0].amount).toBe('1000000');
        expect(mockedRecomposeAndSignTxThunk.mock.calls[0][0].setMaxOutputId).toBeUndefined();
        expect(tradingState.trades).toEqual([
            {
                tradeType: 'sell',
                date: dateISO,
                data: {
                    ...responseData,
                },
                key: responseData.orderId,
                sendAccountKey: 'btc-descriptor-btc',
            },
        ]);
        expect(tradingState.sell.transactionId).toBe('orderId');
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(result.meta.requestStatus).toEqual('fulfilled');
    });
});
