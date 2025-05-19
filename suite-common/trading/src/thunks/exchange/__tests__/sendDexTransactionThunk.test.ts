import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

import { exchangeThunks, tradingThunks } from '../../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { accountBtc } from '../../../__fixtures__/utils';
import { TradingExchangeState } from '../../../reducers/exchangeReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('sendDexTransactionThunk', () => {
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
            status: 'APPROVAL_REQ',
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

        return {
            store,
            returnUrl: 'returnUrl',
            account,
        };
    };

    describe('should return error', () => {
        it.each([
            ['when selectedQuote is undefined', { selectedQuote: undefined }],
            ['when selectedQuote has not dexTx', { selectedQuote: {} }],
            ['when selectedQuote has not receiveAddress', { selectedQuote: { dexTx: {} } }],
            [
                'when selectedQuote status is not APPROVAL_REQ or CONFIRM',
                { selectedQuote: { dexTx: {}, receiveAddress: '', status: 'SUCCESS' } },
            ],
        ])('%s', async (_, selectedQuote) => {
            const { store, returnUrl, account } = getMocks({
                selectedQuote: selectedQuote as TradingExchangeState['selectedQuote'],
            });

            const result = await store.dispatch(
                exchangeThunks.sendDexTransactionThunk({
                    account,
                    returnUrl,
                    nextStep: jest.fn(),
                    triggerAnalyticsTradeConfirmation: jest.fn(),
                    processResponseData: jest.fn(),
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );

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
            const { store, returnUrl, account } = getMocks();

            (tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock) = jest
                .fn()
                .mockImplementation(
                    createThunk('@trading/thunk/recomposeAndSignTx', (_, { rejectWithValue }) =>
                        rejectWithValue(recomposeAndSignPayload),
                    ),
                );

            const result = await store.dispatch(
                exchangeThunks.sendDexTransactionThunk({
                    account,
                    returnUrl,
                    nextStep: jest.fn(),
                    triggerAnalyticsTradeConfirmation: jest.fn(),
                    processResponseData: jest.fn(),
                    signAndPushSendFormTransaction: jest.fn(),
                }),
            );

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

    it('should successfully call confirmTradeThunk for approval transaction', async () => {
        const { store, returnUrl, account } = getMocks();

        (tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(
                createThunk('@trading/thunk/recomposeAndSignTx', (_, { fulfillWithValue }) =>
                    fulfillWithValue({ success: true, payload: { txid: 'txid' } }),
                ),
            );

        (exchangeThunks.confirmTradeThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(
                createThunk('@trading-exchange/thunk/confirmTrade', () => undefined),
            );

        const result = await store.dispatch(
            exchangeThunks.sendDexTransactionThunk({
                account,
                returnUrl,
                nextStep: jest.fn(),
                triggerAnalyticsTradeConfirmation: jest.fn(),
                processResponseData: jest.fn(),
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );

        const confirmTradeThunkArgs = (exchangeThunks.confirmTradeThunk as unknown as jest.Mock)
            .mock.calls[0][0];

        expect(result.meta.requestStatus).toEqual('fulfilled');
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.tradingNew.trades).toEqual([]);
        expect(exchangeThunks.confirmTradeThunk).toHaveBeenCalledTimes(1);
        expect(confirmTradeThunkArgs.trade.approvalSendTxHash).toEqual('txid');
        expect(confirmTradeThunkArgs.trade.status).toEqual('APPROVAL_PENDING');
    });

    it('should successfully call confirmTradeThunk for making trade', async () => {
        const { store, returnUrl, account } = getMocks({
            selectedQuote: {
                ...getQuote(),
                status: 'CONFIRM',
                approvalType: 'INFINITE',
            },
        });

        const dateString = new Date().toISOString();
        jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

        (tradingThunks.recomposeAndSignTxThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(
                createThunk('@trading/thunk/recomposeAndSignTx', (_, { fulfillWithValue }) =>
                    fulfillWithValue({ success: true, payload: { txid: 'txid' } }),
                ),
            );

        (exchangeThunks.confirmTradeThunk as unknown as jest.Mock) = jest
            .fn()
            .mockImplementation(
                createThunk('@trading-exchange/thunk/confirmTrade', () => undefined),
            );

        const result = await store.dispatch(
            exchangeThunks.sendDexTransactionThunk({
                account,
                returnUrl,
                nextStep: jest.fn(),
                triggerAnalyticsTradeConfirmation: jest.fn(),
                processResponseData: jest.fn(),
                signAndPushSendFormTransaction: jest.fn(),
            }),
        );

        const confirmTradeThunkArgs = (exchangeThunks.confirmTradeThunk as unknown as jest.Mock)
            .mock.calls[0][0];
        const { trade } = confirmTradeThunkArgs;

        expect(result.meta.requestStatus).toEqual('fulfilled');
        expect(tradingThunks.recomposeAndSignTxThunk).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.tradingNew.trades).toEqual([
            {
                tradeType: 'exchange',
                date: dateString,
                data: trade,
                key: trade.orderId,
            },
        ]);
        expect(exchangeThunks.confirmTradeThunk).toHaveBeenCalledTimes(1);
        expect(trade.receiveTxHash).toEqual('txid');
        expect(trade.status).toEqual('CONFIRMING');
    });
});
