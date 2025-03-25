import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, ExchangeTrade } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { TradingExchangeState } from '../../../reducers/exchangeReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { getUnusedAddressFromAccount } from '../../../utils';
import { confirmTradeThunk } from '../confirmTradeThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('confirmTradeThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getMocks = (initialExchangeState?: Partial<TradingExchangeState>) => {
        const quoteNotTyped = MIN_MAX_QUOTES_OK[0];
        const quote = {
            ...quoteNotTyped,
            send: quoteNotTyped.send as CryptoId,
            receive: quoteNotTyped.receive as CryptoId,
        };
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
                            selectedQuote: MIN_MAX_QUOTES_OK[1],
                            quotesRequest: {
                                send: quote.send,
                                receive: quote.receive,
                                sendStringAmount: quote.sendStringAmount,
                                dex: 'enable',
                            },
                            ...(initialExchangeState ?? {}),
                        },
                    },
                },
            },
        });

        const mockProcessResponseData = jest.fn();
        const mockTriggerAnalyticsTradeConfirmation = jest.fn();
        const mockNextStep = jest.fn();

        const account = accountBtc as Account;

        const trade = {
            ...quote,
            quoteId: 'quoteId',
            fromAddress: 'fromAddress',
        };

        return {
            store,
            returnUrl: 'returnUrl',
            receiveAddress: 'receiveAddress',
            account,
            trade,
            mockProcessResponseData,
            mockTriggerAnalyticsTradeConfirmation,
            mockNextStep,
        };
    };

    it('should return false from confirmation when quotesRequest is undefined', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks({ quotesRequest: undefined });

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.tradingNew;

        expect(exchange.quotesRequest).toBeUndefined();
        expect(store.getActions().length).toEqual(2); // loadings
        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(exchange.isLoading).toBeFalsy();
        expect(response).toBeFalsy();
    });

    it('should return false from confirmation when refundAddress is undefined', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account: {
                        ...account,
                        addresses: undefined,
                    } as Account,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.tradingNew;

        expect(store.getActions().length).toEqual(2); // loadings
        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(exchange.isLoading).toBeFalsy();
        expect(response).toBeFalsy();
    });

    it('should return false from confirmation when trade is undefined', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks({ selectedQuote: undefined });

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.tradingNew;

        expect(store.getActions().length).toEqual(2); // loadings
        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toBeUndefined();
        expect(response).toBeFalsy();
    });

    it('should return false from confirmation when trade.quoteId is undefined (using default selectedQuote)', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.tradingNew;

        expect(store.getActions().length).toEqual(2); // loadings
        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(exchange.isLoading).toBeFalsy();
        expect(response).toBeFalsy();
    });

    it('should return false from confirmation when response is undefined ', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            trade,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        invityAPI.doExchangeTrade = () => Promise.resolve(undefined as unknown as ExchangeTrade);

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.tradingNew;
        const actionToast = store
            .getActions()
            .find(action => action.type === '@common/in-app-notifications/addToast');

        expect(actionToast?.payload?.type).toEqual('error');
        expect(actionToast?.payload?.error).toEqual('No response from the server');

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(4);
        expect(exchange.transactionId).toBeUndefined();
        expect(exchange.isLoading).toBeFalsy();
        expect(response).toBeFalsy();
    });

    describe('should return false from confirmation', () => {
        it.each([
            [
                'when response.error is defined',
                {
                    error: 'Server error',
                },
            ],
            [
                'when response.state is undefined',
                {
                    status: undefined,
                },
            ],
            [
                'when response.orderId is undefined',
                {
                    orderId: undefined,
                },
            ],
            [
                'when response.status is ERROR',
                {
                    status: 'ERROR',
                },
            ],
        ])(`%s`, async (_, mockResponse) => {
            const {
                store,
                returnUrl,
                receiveAddress,
                account,
                trade,
                mockProcessResponseData,
                mockNextStep,
                mockTriggerAnalyticsTradeConfirmation,
            } = getMocks();
            const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

            invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

            const response = await store
                .dispatch(
                    confirmTradeThunk({
                        returnUrl,
                        receiveAddress,
                        account,
                        trade,
                        nextStep: mockNextStep,
                        triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                        processResponseData: mockProcessResponseData,
                    }),
                )
                .unwrap();

            const { exchange } = store.getState().wallet.tradingNew;
            const actionToast = store
                .getActions()
                .find(action => action.type === '@common/in-app-notifications/addToast');

            expect(actionToast?.payload?.type).toEqual('error');
            expect(actionToast?.payload?.error).toEqual(
                'error' in mockResponse ? mockResponse?.error : 'Error response from the server',
            );

            expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(store.getActions().length).toEqual(5);
            expect(exchange.transactionId).toBeUndefined();

            expect(exchange.isLoading).toBeFalsy();
            expect(exchange.selectedQuote).toEqual(tradeResponse);
            expect(response).toBeFalsy();
        });
    });

    describe('should return true from confirmation for approval and sign transaction', () => {
        it.each([
            [
                'when response.status is APPROVAL_REQ',
                {
                    status: 'APPROVAL_REQ',
                    orderId: 'orderId',
                },
                'SEND_APPROVAL_TRANSACTION',
            ],
            [
                'when response.status is APPROVAL_PENDING',
                {
                    status: 'APPROVAL_PENDING',
                    orderId: 'orderId',
                },
                'SEND_APPROVAL_TRANSACTION',
            ],
            [
                'when response.status is SIGN_DATA',
                {
                    status: 'SIGN_DATA',
                    orderId: 'orderId',
                },
                'SIGN_DATA',
            ],
        ])(`%s`, async (_, mockResponse, step) => {
            const {
                store,
                returnUrl,
                receiveAddress,
                account,
                trade,
                mockProcessResponseData,
                mockNextStep,
                mockTriggerAnalyticsTradeConfirmation,
            } = getMocks();

            const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

            invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

            const response = await store
                .dispatch(
                    confirmTradeThunk({
                        returnUrl,
                        receiveAddress,
                        account,
                        trade,
                        nextStep: mockNextStep,
                        triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                        processResponseData: mockProcessResponseData,
                    }),
                )
                .unwrap();

            const { exchange } = store.getState().wallet.tradingNew;

            expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(store.getActions().length).toEqual(5);
            expect(exchange.transactionId).toBeUndefined();

            expect(exchange.isLoading).toBeFalsy();
            expect(exchange.selectedQuote).toEqual(tradeResponse);
            expect(exchange.formStep).toEqual(step);
            expect(response).toBeTruthy();
        });
    });

    it('should return true from confirmation when transaction is confirmed', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            trade,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        const mockResponse = {
            status: 'CONFIRM',
            orderId: 'orderId',
        };

        const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.tradingNew;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(5);
        expect(exchange.transactionId).toBeUndefined();
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(tradeResponse);
        expect(exchange.formStep).toEqual('SEND_TRANSACTION');
        expect(response).toBeTruthy();
    });

    describe('should return true from confirmation for trade, which is in to confirm state from dex and request approval transaction', () => {
        it.each([
            [
                'when formStep is RECEIVING_ADDRESS',
                {
                    status: 'CONFIRM',
                    orderId: 'orderId',
                    isDex: true,
                },
                'when trade.approvalType is ZERO',
                {
                    status: 'CONFIRM',
                    orderId: 'orderId',
                    isDex: true,
                    approvalType: 'ZERO',
                },
            ],
        ])('%s', async (_, mockResponse) => {
            const {
                store,
                returnUrl,
                receiveAddress,
                account,
                trade,
                mockProcessResponseData,
                mockNextStep,
                mockTriggerAnalyticsTradeConfirmation,
            } = getMocks();

            const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

            invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

            const response = await store
                .dispatch(
                    confirmTradeThunk({
                        returnUrl,
                        receiveAddress,
                        account,
                        trade,
                        nextStep: mockNextStep,
                        triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                        processResponseData: mockProcessResponseData,
                    }),
                )
                .unwrap();

            const { exchange } = store.getState().wallet.tradingNew;

            expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(store.getActions().length).toEqual(5);
            expect(exchange.transactionId).toBeUndefined();
            expect(exchange.isLoading).toBeFalsy();
            expect(exchange.selectedQuote).toEqual(tradeResponse);
            expect(exchange.formStep).toEqual('SEND_APPROVAL_TRANSACTION');
            expect(response).toBeTruthy();
        });
    });

    it('should return true from confirmation for trade, which is in to confirm state from dex and set next step', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            trade,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks({
            formStep: 'SEND_APPROVAL_TRANSACTION',
        });

        const mockResponse = {
            status: 'CONFIRM',
            orderId: 'orderId',
            isDex: true,
        };

        const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.tradingNew;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(5);
        expect(exchange.transactionId).toBeUndefined();
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(tradeResponse);
        expect(exchange.formStep).toEqual('SEND_TRANSACTION');
        expect(response).toBeTruthy();
    });

    it('should return true from confirmation for trade with status CONFIRMING and SUCCESS and set trade, transactionId and call nextStep', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            trade,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        const dateString = new Date().toISOString();
        jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

        const mockResponse = {
            status: 'SUCCESS',
            orderId: 'orderId',
            isDex: true,
        };

        const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { tradingNew } = store.getState().wallet;
        const { exchange } = tradingNew;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(5);
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(exchange.selectedQuote);
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(tradingNew.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
            account: {
                descriptor: 'btc-descriptor',
                symbol: 'btc',
                accountType: 'segwit',
                accountIndex: 1,
            },
        });
        expect(response).toBeTruthy();
    });

    it('should return true from confirmation for trade with status CONFIRMING and SUCCESS and set trade, transactionId and call nextStep when fromAddress in trade is undefined', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            trade,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        const dateString = new Date().toISOString();
        jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

        const mockResponse = {
            status: 'SUCCESS',
            orderId: 'orderId',
            isDex: true,
        };
        const { address: refundAddress } = getUnusedAddressFromAccount(account);

        const tradeWithUndefinedAddress = { ...trade, fromAddress: undefined, isDex: true };
        const tradeResponse = {
            ...trade,
            fromAddress: refundAddress,
            ...mockResponse,
        } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade: tradeWithUndefinedAddress,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { tradingNew } = store.getState().wallet;
        const { exchange } = tradingNew;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(5);
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(exchange.selectedQuote);
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(tradingNew.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
            account: {
                descriptor: 'btc-descriptor',
                symbol: 'btc',
                accountType: 'segwit',
                accountIndex: 1,
            },
        });
        expect(response).toBeTruthy();
    });

    it('should return true from confirmation for trade, set trade, transactionId and call processResponseData when status CONFIRMING or SUCCESS', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            trade,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        const dateString = new Date().toISOString();
        jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

        const mockResponse = {
            status: 'CONFIRMING',
            orderId: 'orderId',
            isDex: true,
            tradeForm: {
                form: {
                    formMethod: 'GET' as const,
                    formAction: 'action',
                    formTarget: '_blank' as const,
                    fields: {
                        key: 'string',
                    },
                },
            },
        };

        const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { tradingNew } = store.getState().wallet;
        const { exchange } = tradingNew;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(5);
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(exchange.selectedQuote);
        expect(tradingNew.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
            account: {
                descriptor: 'btc-descriptor',
                symbol: 'btc',
                accountType: 'segwit',
                accountIndex: 1,
            },
        });
        expect(mockProcessResponseData).toHaveBeenCalledTimes(1);
        expect(response).toBeTruthy();
    });

    it('should return true from confirmation for trade with status LOADING and set trade, transactionId and set step to SEND_TRANSACTION', async () => {
        const {
            store,
            returnUrl,
            receiveAddress,
            account,
            trade,
            mockProcessResponseData,
            mockNextStep,
            mockTriggerAnalyticsTradeConfirmation,
        } = getMocks();

        const dateString = new Date().toISOString();
        jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

        const mockResponse = {
            status: 'LOADING',
            orderId: 'orderId',
            isDex: true,
        };

        const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { tradingNew } = store.getState().wallet;
        const { exchange } = tradingNew;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(6);
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(exchange.selectedQuote);
        expect(tradingNew.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
            account: {
                descriptor: 'btc-descriptor',
                symbol: 'btc',
                accountType: 'segwit',
                accountIndex: 1,
            },
        });
        expect(exchange.formStep).toEqual('SEND_TRANSACTION');
        expect(response).toBeTruthy();
    });
});
