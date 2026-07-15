import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { exchangeThunks } from '../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { type TradingExchangeState } from '../../../reducers/exchangeReducer';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { getUnusedAddressFromAccount } from '../../../utils';
import type { LogErrorThunkProps } from '../../common/logErrorThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

jest.mock('../../common/logErrorThunk', () => ({
    logErrorThunk: (props: LogErrorThunkProps) => ({
        type: 'mockedLogErrorThunk',
        payload: props,
    }),
}));

describe('confirmExchangeTradeThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getMocks = (initialExchangeState?: Partial<TradingExchangeState>) => {
        const quoteNotTyped = MIN_MAX_QUOTES_OK[0];
        if (!quoteNotTyped) throw new Error('Missing test fixture');
        const quote = {
            ...quoteNotTyped,
            send: quoteNotTyped.send as CryptoId,
            receive: quoteNotTyped.receive as CryptoId,
        };
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
                exchangeThunks.confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.trading;

        expect(exchange.quotesRequest).toBeUndefined();
        expect(store.getActions().length).toEqual(2); // loadings
        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(exchange.isLoading).toBeFalsy();
        expect(!!response).toBeFalsy();
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
                exchangeThunks.confirmTradeThunk({
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

        const { exchange } = store.getState().wallet.trading;

        expect(store.getActions().length).toEqual(2); // loadings
        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(exchange.isLoading).toBeFalsy();
        expect(!!response).toBeFalsy();
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
                exchangeThunks.confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.trading;

        expect(store.getActions().length).toEqual(2); // loadings
        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toBeUndefined();
        expect(!!response).toBeFalsy();
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
                exchangeThunks.confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { exchange } = store.getState().wallet.trading;

        expect(store.getActions().length).toEqual(2); // loadings
        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(exchange.isLoading).toBeFalsy();
        expect(!!response).toBeFalsy();
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
                exchangeThunks.confirmTradeThunk({
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

        const { exchange } = store.getState().wallet.trading;
        const actionToast = store
            .getActions()
            .find(action => action.type === 'mockedLogErrorThunk');

        expect(actionToast?.payload).toEqual({
            errorMessage: 'No response from the server',
            tradingType: 'exchange',
        });

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(3);
        expect(exchange.transactionId).toBeUndefined();
        expect(exchange.isLoading).toBeFalsy();
        expect(!!response).toBeFalsy();
    });

    it('should return undefined when request is aborted', async () => {
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

        invityAPI.doExchangeTrade = () =>
            new Promise<ExchangeTrade>(resolve => {
                resolve(undefined as unknown as ExchangeTrade);
            });

        const promise = store.dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress,
                account,
                trade,
                nextStep: mockNextStep,
                triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                processResponseData: mockProcessResponseData,
            }),
        );

        promise.abort();

        const action = await promise;

        expect(exchangeThunks.confirmTradeThunk.rejected.match(action)).toBe(true);

        if (!exchangeThunks.confirmTradeThunk.rejected.match(action)) {
            throw new Error('Expected confirmTradeThunk to be rejected');
        }

        expect(action.meta.aborted).toBe(true);
        expect(action.payload).toBeUndefined();
    });

    describe('should return false from confirmation', () => {
        it.each([
            [
                'when response.error is defined',
                { error: 'Server error' },
                { code: 'unknown', message: 'Server error' },
            ],
            ['when response.state is undefined', { status: undefined }, { code: 'unknown' }],
            ['when response.orderId is undefined', { orderId: undefined }, { code: 'unknown' }],
            ['when response.status is ERROR', { status: 'ERROR' }, { code: 'unknown' }],
            [
                'when response has errorDetails but no error string',
                {
                    status: 'ERROR',
                    errorDetails: {
                        origin: 'partner',
                        externalCode: '-100',
                        code: 'invalid_amount',
                        amount: { key: 'BTC', value: '0.00001', min: '0.001', max: '5' },
                    },
                },
                {
                    code: 'invalid_amount',
                    message: '-100',
                    values: { min: '0.001', max: '5' },
                },
            ],
        ])(`%s`, async (_, mockResponse, expectedErrorMessage) => {
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
                    exchangeThunks.confirmTradeThunk({
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

            const { exchange } = store.getState().wallet.trading;
            const actionToast = store
                .getActions()
                .find(action => action.type === 'mockedLogErrorThunk');

            expect(actionToast?.payload).toEqual({
                tradingType: 'exchange',
                errorMessage: expectedErrorMessage,
            });

            expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(store.getActions().length).toEqual(4);
            expect(exchange.transactionId).toBeUndefined();

            expect(exchange.isLoading).toBeFalsy();
            expect(exchange.selectedQuote).toEqual(tradeResponse);
            expect(!!response).toBeFalsy();
        });
    });

    it('should route a failed trade with orderId to the detail page instead of a toast', async () => {
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
            status: 'ERROR',
            orderId: 'orderId',
            error: 'Server error',
        };
        const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                exchangeThunks.confirmTradeThunk({
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

        const { trading } = store.getState().wallet;
        const { exchange } = trading;

        const toastAction = store
            .getActions()
            .find(action => action.type === 'mockedLogErrorThunk');

        expect(toastAction).toBeUndefined();
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(trading.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
        });
        expect(!!response).toBeFalsy();
    });

    it('should keep a failed approvalFlow trade with orderId on the form instead of routing to detail', async () => {
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
            status: 'ERROR',
            orderId: 'orderId',
            error: 'Server error',
        };
        const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                exchangeThunks.confirmTradeThunk({
                    returnUrl,
                    receiveAddress,
                    account,
                    trade,
                    approvalFlow: true,
                    nextStep: mockNextStep,
                    triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const { trading } = store.getState().wallet;
        const { exchange } = trading;

        const toastAction = store
            .getActions()
            .find(action => action.type === 'mockedLogErrorThunk');

        expect(toastAction?.payload).toEqual({
            tradingType: 'exchange',
            errorMessage: { code: 'unknown', message: 'Server error' },
        });
        expect(exchange.transactionId).toBeUndefined();
        expect(exchange.selectedQuote).toEqual(tradeResponse);
        expect(mockNextStep).not.toHaveBeenCalled();
        expect(trading.trades).toEqual([]);
        expect(!!response).toBeFalsy();
    });

    describe('should return true from confirmation for approval and sign transaction', () => {
        it.each([
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
                    exchangeThunks.confirmTradeThunk({
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

            const { exchange } = store.getState().wallet.trading;

            expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(store.getActions().length).toEqual(4);
            expect(exchange.transactionId).toBeUndefined();

            expect(exchange.isLoading).toBeFalsy();
            expect(exchange.selectedQuote).toEqual(tradeResponse);
            expect(exchange.formStep).toEqual(step);
            expect(!!response).toBeTruthy();
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
                exchangeThunks.confirmTradeThunk({
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

        const { exchange } = store.getState().wallet.trading;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(4);
        expect(exchange.transactionId).toBeUndefined();
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(tradeResponse);
        expect(exchange.formStep).toEqual('SEND_TRANSACTION');
        expect(!!response).toBeTruthy();
    });

    describe('should return true from confirmation for trade, which is in to confirm state from dex and request approval transaction', () => {
        it('when trade.approvalType is ZERO', async () => {
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

            const tradeResponse = {
                ...trade,
                status: 'CONFIRM',
                orderId: 'orderId',
                isDex: true,
                approvalType: 'ZERO',
            } as ExchangeTrade;

            invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

            const response = await store
                .dispatch(
                    exchangeThunks.confirmTradeThunk({
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

            const { exchange } = store.getState().wallet.trading;

            expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
            expect(store.getActions().length).toEqual(4);
            expect(exchange.transactionId).toBeUndefined();
            expect(exchange.isLoading).toBeFalsy();
            expect(exchange.selectedQuote).toEqual(tradeResponse);
            expect(exchange.formStep).toEqual('SEND_TRANSACTION');
            expect(!!response).toBeTruthy();
        });
    });

    it('should return true from confirmation for trade, which is in to confirm state from dex', async () => {
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
            isDex: true,
        };

        const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

        invityAPI.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await store
            .dispatch(
                exchangeThunks.confirmTradeThunk({
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

        const { exchange } = store.getState().wallet.trading;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(4);
        expect(exchange.transactionId).toBeUndefined();
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(tradeResponse);
        expect(!!response).toBeTruthy();
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
                exchangeThunks.confirmTradeThunk({
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

        const { trading } = store.getState().wallet;
        const { exchange } = trading;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(5);
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(tradeResponse);
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(trading.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
        });
        expect(!!response).toBeTruthy();
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
                exchangeThunks.confirmTradeThunk({
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

        const { trading } = store.getState().wallet;
        const { exchange } = trading;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(5);
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(exchange.selectedQuote);
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(trading.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
        });
        expect(!!response).toBeTruthy();
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
                exchangeThunks.confirmTradeThunk({
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

        const { trading } = store.getState().wallet;
        const { exchange } = trading;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(5);
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(exchange.selectedQuote);
        expect(trading.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
        });
        expect(mockProcessResponseData).toHaveBeenCalledTimes(1);
        expect(!!response).toBeTruthy();
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
                exchangeThunks.confirmTradeThunk({
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

        const { trading } = store.getState().wallet;
        const { exchange } = trading;

        expect(mockTriggerAnalyticsTradeConfirmation).toHaveBeenCalledTimes(1);
        expect(store.getActions().length).toEqual(6);
        expect(exchange.transactionId).toBe(mockResponse.orderId);
        expect(exchange.isLoading).toBeFalsy();
        expect(exchange.selectedQuote).toEqual(exchange.selectedQuote);
        expect(trading.trades[0]).toEqual({
            tradeType: 'exchange',
            date: dateString,
            data: tradeResponse,
            key: mockResponse.orderId,
        });
        expect(exchange.formStep).toEqual('SEND_TRANSACTION');
        expect(!!response).toBeTruthy();
    });

    describe('approvalFlow', () => {
        it('should forward approvalFlow: true to doExchangeTrade', async () => {
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

            const tradeResponse = {
                ...trade,
                status: 'CONFIRM',
                orderId: 'orderId',
            } as ExchangeTrade;

            const doExchangeTradeSpy = jest.fn().mockResolvedValue(tradeResponse);
            invityAPI.doExchangeTrade = doExchangeTradeSpy;

            await store
                .dispatch(
                    exchangeThunks.confirmTradeThunk({
                        returnUrl,
                        receiveAddress,
                        account,
                        trade,
                        approvalFlow: true,
                        nextStep: mockNextStep,
                        triggerAnalyticsTradeConfirmation: mockTriggerAnalyticsTradeConfirmation,
                        processResponseData: mockProcessResponseData,
                    }),
                )
                .unwrap();

            expect(doExchangeTradeSpy).toHaveBeenCalledWith(
                expect.objectContaining({ approvalFlow: true }),
                expect.anything(),
            );
        });

        it('should default approvalFlow to false when omitted', async () => {
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

            const tradeResponse = {
                ...trade,
                status: 'CONFIRM',
                orderId: 'orderId',
            } as ExchangeTrade;

            const doExchangeTradeSpy = jest.fn().mockResolvedValue(tradeResponse);
            invityAPI.doExchangeTrade = doExchangeTradeSpy;

            await store
                .dispatch(
                    exchangeThunks.confirmTradeThunk({
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

            expect(doExchangeTradeSpy).toHaveBeenCalledWith(
                expect.objectContaining({ approvalFlow: false }),
                expect.anything(),
            );
        });
    });
});
