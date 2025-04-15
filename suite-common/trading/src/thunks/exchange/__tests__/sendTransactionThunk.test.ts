import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

import { exchangeThunks, tradingThunks } from '../../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { accountBtc } from '../../../__fixtures__/utils';
import { TradingExchangeState } from '../../../reducers/exchangeReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('sendTransactionThunk', () => {
    beforeEach(() => {
        (tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(
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

    afterEach(() => {
        jest.clearAllMocks();
    });

    const getQuote = () => {
        const quoteNotTyped = MIN_MAX_QUOTES_OK[0];
        const quote = {
            ...quoteNotTyped,
            send: quoteNotTyped.send as CryptoId,
            receive: quoteNotTyped.receive as CryptoId,
            receiveAddress: 'receiveAddress',
            orderId: 'orderId',
            dexTx: {
                from: 'from',
                to: 'to',
                data: 'data',
                value: 'value',
            },
            status: 'APPROVAL_REQ' as const,
            partnerPaymentExtraId: 'partnerPaymentExtraId',
        };

        return quote;
    };

    const getMocks = (initialExchangeState?: Partial<TradingExchangeState>) => {
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
                        exchange: {
                            ...initialState.exchange,
                            selectedQuote: getQuote(),
                            ...initialExchangeState,
                        },
                    },
                },
            },
        });

        const account = accountBtc as Account;

        const trade = {
            tradeType: 'exchange' as const,
            date: new Date().toISOString(),
            key: getQuote().orderId,
            account: {
                descriptor: account.descriptor,
                symbol: account.symbol,
                accountType: account.accountType,
                accountIndex: account.index,
            },
            data: {
                ...getQuote(),
                sendAddress: '1',
            },
        };

        return {
            store,
            returnUrl: 'returnUrl',
            account,
            trade,
        };
    };

    it('should send dex transaction', async () => {
        const { store, returnUrl, account } = getMocks({
            selectedQuote: {
                ...getQuote(),
                isDex: true,
            },
        });

        (exchangeThunks.sendDexTransactionThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(
                createThunk('@trading-exchange/thunk/sendDexTransactionThunk', () => undefined),
            );

        const result = await store
            .dispatch(
                exchangeThunks.sendTransactionThunk({
                    account,
                    trade: undefined,
                    returnUrl,
                    setMaxOutputId: undefined,
                    decimals: getNetwork(account.symbol).decimals,
                    shouldSendInSats: false,
                    nextStep: jest.fn(),
                    processResponseData: jest.fn(),
                    triggerAnalyticsTradeConfirmation: jest.fn(),
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            )
            .unwrap();

        expect(store.getState().wallet.tradingNew.modalAccountKey).toBe(account.key);
        expect(exchangeThunks.sendDexTransactionThunk).toHaveBeenCalledTimes(1);
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(0);
        expect(result).toBeUndefined();
    });

    it('should not send dex transaction and return error when sendDexTransactionThunk is rejected', async () => {
        const { store, returnUrl, account } = getMocks({
            selectedQuote: {
                ...getQuote(),
                isDex: true,
            },
        });
        const rejectValue = {
            type: 'error',
            error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
        };

        (exchangeThunks.sendDexTransactionThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(
                createThunk(
                    '@trading-exchange/thunk/sendDexTransactionThunk',
                    (_, { rejectWithValue }) => rejectWithValue(rejectValue),
                ),
            );

        const result = await store.dispatch(
            exchangeThunks.sendTransactionThunk({
                account,
                trade: undefined,
                returnUrl,
                setMaxOutputId: undefined,
                decimals: getNetwork(account.symbol).decimals,
                shouldSendInSats: false,
                nextStep: jest.fn(),
                processResponseData: jest.fn(),
                triggerAnalyticsTradeConfirmation: jest.fn(),
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );

        expect(store.getState().wallet.tradingNew.modalAccountKey).toBe(account.key);
        expect(exchangeThunks.sendDexTransactionThunk).toHaveBeenCalledTimes(1);
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(0);
        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toEqual(rejectValue);
    });

    describe('should return error', () => {
        it.each([
            ['when trade data is undefined', { trade: undefined }],
            ['when trade data has not orderId', { trade: {} }],
            ['when trade data has not sendStringAmount', { trade: { orderId: 'orderId' } }],
            [
                'when trade data has not sendAddress',
                { trade: { orderId: 'orderId', sendStringAmount: '1' } },
            ],
        ])('%s', async (_, tradeTest) => {
            const { store, returnUrl, account } = getMocks();

            const result = await store.dispatch(
                exchangeThunks.sendTransactionThunk({
                    account,
                    trade: {
                        ...(tradeTest.trade as ExchangeTrade),
                    },
                    returnUrl,
                    decimals: getNetwork(account.symbol).decimals,
                    shouldSendInSats: false,
                    nextStep: jest.fn(),
                    triggerAnalyticsTradeConfirmation: jest.fn(),
                    processResponseData: jest.fn(),
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );

            expect(store.getState().wallet.tradingNew.modalAccountKey).toBe(account.key);
            expect(exchangeThunks.sendDexTransactionThunk).toHaveBeenCalledTimes(0);
            expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(0);
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
            const { store, returnUrl, account, trade } = getMocks();

            (tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock) = jest
                .fn()
                .mockImplementation(
                    createThunk('@trading/thunk/recomposeAndSignTx', (_, { rejectWithValue }) =>
                        rejectWithValue(recomposeAndSignPayload),
                    ),
                );

            const result = await store.dispatch(
                exchangeThunks.sendTransactionThunk({
                    account,
                    trade: trade.data,
                    returnUrl,
                    decimals: getNetwork(account.symbol).decimals,
                    shouldSendInSats: false,
                    nextStep: jest.fn(),
                    triggerAnalyticsTradeConfirmation: jest.fn(),
                    processResponseData: jest.fn(),
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );

            expect(store.getState().wallet.tradingNew.modalAccountKey).toBe(account.key);
            expect(exchangeThunks.sendDexTransactionThunk).toHaveBeenCalledTimes(0);
            expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
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

    it('should send transaction, save trade and call next step', async () => {
        const { store, returnUrl, account, trade } = getMocks({
            selectedQuote: {
                ...getQuote(),
                partnerPaymentExtraId: undefined,
            },
        });

        const mockNextStep = jest.fn();
        const dateString = new Date().toISOString();
        jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

        const result = await store.dispatch(
            exchangeThunks.sendTransactionThunk({
                account,
                trade: {
                    ...trade.data,
                    ...trade.data,
                    partnerPaymentExtraId: undefined,
                },
                returnUrl,
                decimals: getNetwork(account.symbol).decimals,
                shouldSendInSats: true,
                nextStep: mockNextStep,
                triggerAnalyticsTradeConfirmation: jest.fn(),
                processResponseData: jest.fn(),
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );

        expect(store.getState().wallet.tradingNew.modalAccountKey).toBe(account.key);
        expect(exchangeThunks.sendDexTransactionThunk).toHaveBeenCalledTimes(0);
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.tradingNew.trades).toEqual([
            {
                tradeType: 'exchange',
                date: dateString,
                data: {
                    ...trade.data,
                    partnerPaymentExtraId: undefined,
                },
                key: trade.data.orderId,
                account: {
                    descriptor: 'btc-descriptor',
                    symbol: 'btc',
                    accountType: 'segwit',
                    accountIndex: 1,
                },
            },
        ]);
        expect(store.getState().wallet.tradingNew.exchange.transactionId).toBe(trade.data.orderId);
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(result.meta.requestStatus).toEqual('fulfilled');
    });
});
