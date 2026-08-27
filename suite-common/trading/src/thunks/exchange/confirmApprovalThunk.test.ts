import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { MIN_MAX_QUOTES_OK } from '../../__fixtures__/exchangeUtils';
import { accountBtc } from '../../__fixtures__/utils';
import { type TradingExchangeState } from '../../reducers/exchangeReducer';
import { initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradeApi } from '../../tradeApi';
import { getUnusedAddressFromAccount } from '../../utils';
import type { LogErrorThunkProps } from '../common/logErrorThunk';

import { exchangeThunks } from './index';

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

jest.mock('../common/logErrorThunk', () => ({
    logErrorThunk: (props: LogErrorThunkProps) => ({
        type: 'mockedLogErrorThunk',
        payload: props,
    }),
}));

jest.mock('../../tradeApi');

describe('confirmApprovalThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    tradeApi.setServersEnvironment = () => {};
    tradeApi.createApiKey = () => {};

    const getMocks = (initialExchangeState?: Partial<TradingExchangeState>) => {
        const quoteNotTyped = MIN_MAX_QUOTES_OK[0];
        if (!quoteNotTyped) throw new Error('Missing test fixture');
        const quote = {
            ...quoteNotTyped,
            send: quoteNotTyped.send as CryptoId,
            receive: quoteNotTyped.receive as CryptoId,
        };
        const store = configureMockStore({
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

        const account = accountBtc as Account;

        const trade = {
            ...quote,
            quoteId: 'quoteId',
            fromAddress: 'fromAddress',
        };

        return {
            store,
            receiveAddress: 'receiveAddress',
            account,
            trade,
            mockProcessResponseData,
        };
    };

    const dispatchThunk = (
        store: ReturnType<typeof getMocks>['store'],
        props: Parameters<typeof exchangeThunks.confirmApprovalThunk>[0],
    ) => store.dispatch(exchangeThunks.confirmApprovalThunk(props)).unwrap();

    const getExchangeState = (store: ReturnType<typeof getMocks>['store']) =>
        store.getState().wallet.trading.exchange;

    const getTradingState = (store: ReturnType<typeof getMocks>['store']) =>
        store.getState().wallet.trading;

    const findLogErrorAction = (store: ReturnType<typeof getMocks>['store']) =>
        store.getActions().find(action => action.type === 'mockedLogErrorThunk');

    describe('guard clauses', () => {
        it.each([
            [
                'quotesRequest is undefined',
                { stateOverride: { quotesRequest: undefined }, tradeOverride: undefined },
            ],
            [
                'trade and selectedQuote are both undefined',
                { stateOverride: { selectedQuote: undefined }, tradeOverride: undefined },
            ],
            [
                'trade.quoteId is undefined (falls back to selectedQuote without quoteId)',
                { stateOverride: undefined, tradeOverride: undefined },
            ],
        ])('should return undefined when %s', async (_, { stateOverride, tradeOverride }) => {
            const { store, receiveAddress, account, mockProcessResponseData } = getMocks(
                stateOverride ?? {},
            );

            const response = await dispatchThunk(store, {
                receiveAddress,
                account,
                trade: tradeOverride,
                processResponseData: mockProcessResponseData,
            });

            expect(response).toBeUndefined();
        });

        it('should return undefined when refundAddress is undefined', async () => {
            const { store, receiveAddress, account, mockProcessResponseData } = getMocks();

            const response = await dispatchThunk(store, {
                receiveAddress,
                account: { ...account, addresses: undefined } as Account,
                processResponseData: mockProcessResponseData,
            });

            expect(response).toBeUndefined();
        });
    });

    describe('API call', () => {
        it('should use refundAddress as fromAddress when trade.fromAddress is undefined', async () => {
            const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();
            const { address: refundAddress } = getUnusedAddressFromAccount(account);

            const doExchangeTradeSpy = jest.fn().mockResolvedValue({
                ...trade,
                status: 'SUCCESS',
                orderId: 'orderId',
            } as ExchangeTrade);

            tradeApi.doExchangeTrade = doExchangeTradeSpy;

            await dispatchThunk(store, {
                receiveAddress,
                account,
                trade: { ...trade, fromAddress: undefined },
                processResponseData: mockProcessResponseData,
            });

            expect(doExchangeTradeSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    trade: expect.objectContaining({ fromAddress: refundAddress }),
                }),
            );
        });

        it('should keep original fromAddress when trade.fromAddress is defined', async () => {
            const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();

            const doExchangeTradeSpy = jest.fn().mockResolvedValue({
                ...trade,
                status: 'SUCCESS',
                orderId: 'orderId',
            } as ExchangeTrade);

            tradeApi.doExchangeTrade = doExchangeTradeSpy;

            await dispatchThunk(store, {
                receiveAddress,
                account,
                trade,
                processResponseData: mockProcessResponseData,
            });

            expect(doExchangeTradeSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    trade: expect.objectContaining({ fromAddress: 'fromAddress' }),
                }),
            );
        });
    });

    describe('when API returns no response', () => {
        it('should log error and return undefined', async () => {
            const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();

            tradeApi.doExchangeTrade = () => Promise.resolve(undefined as unknown as ExchangeTrade);

            const response = await dispatchThunk(store, {
                receiveAddress,
                account,
                trade,
                processResponseData: mockProcessResponseData,
            });

            expect(findLogErrorAction(store)?.payload).toEqual({
                errorMessage: 'No response from the server',
                tradingType: 'exchange',
            });
            expect(response).toBeUndefined();
        });
    });

    describe('when API returns error response', () => {
        it.each([
            [
                'response.error is defined',
                { error: 'Server error' },
                { code: 'unknown', message: 'Server error' },
            ],
            ['response.status is undefined', { status: undefined }, { code: 'unknown' }],
            ['response.orderId is undefined', { orderId: undefined }, { code: 'unknown' }],
            ['response.status is ERROR', { status: 'ERROR' }, { code: 'unknown' }],
            [
                'response has errorDetails but no error string',
                {
                    status: 'ERROR',
                    errorDetails: {
                        origin: 'partner',
                        externalCode: '-100',
                        code: 'invalid_amount',
                        amount: { key: 'BTC', value: '0.00001', min: '0.001', max: '5' },
                    },
                },
                { code: 'invalid_amount', message: '-100', values: { min: '0.001', max: '5' } },
            ],
        ])(
            'should log error and save quote when %s',
            async (_, mockResponse, expectedErrorMessage) => {
                const { store, receiveAddress, account, trade, mockProcessResponseData } =
                    getMocks();
                const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

                tradeApi.doExchangeTrade = () => Promise.resolve(tradeResponse);

                const response = await dispatchThunk(store, {
                    receiveAddress,
                    account,
                    trade,
                    processResponseData: mockProcessResponseData,
                });

                expect(findLogErrorAction(store)?.payload).toEqual({
                    tradingType: 'exchange',
                    errorMessage: expectedErrorMessage,
                });
                expect(getExchangeState(store).selectedQuote).toEqual(tradeResponse);
                expect(response).toEqual(tradeResponse);
            },
        );
    });

    describe('when API returns approval status', () => {
        it.each([
            ['APPROVAL_REQ', { status: 'APPROVAL_REQ', orderId: 'orderId' }],
            ['APPROVAL_PENDING', { status: 'APPROVAL_PENDING', orderId: 'orderId' }],
        ])('should save quote without changing formStep for %s', async (_, mockResponse) => {
            const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();
            const tradeResponse = { ...trade, ...mockResponse } as ExchangeTrade;

            tradeApi.doExchangeTrade = () => Promise.resolve(tradeResponse);

            const response = await dispatchThunk(store, {
                receiveAddress,
                account,
                trade,
                processResponseData: mockProcessResponseData,
            });

            expect(getExchangeState(store).selectedQuote).toEqual(tradeResponse);
            expect(getExchangeState(store).formStep).not.toBe('SIGN_DATA');
            expect(getExchangeState(store).formStep).not.toBe('SEND_TRANSACTION');
            expect(response).toEqual(tradeResponse);
        });
    });

    it('should save quote and set formStep to SIGN_DATA when response status is SIGN_DATA', async () => {
        const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();
        const tradeResponse = {
            ...trade,
            status: 'SIGN_DATA',
            orderId: 'orderId',
        } as ExchangeTrade;

        tradeApi.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await dispatchThunk(store, {
            receiveAddress,
            account,
            trade,
            processResponseData: mockProcessResponseData,
        });

        expect(getExchangeState(store).selectedQuote).toEqual(tradeResponse);
        expect(getExchangeState(store).formStep).toBe('SIGN_DATA');
        expect(response).toEqual(tradeResponse);
    });

    it('should save quote and set formStep to SEND_TRANSACTION when response status is CONFIRM', async () => {
        const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();
        const tradeResponse = {
            ...trade,
            status: 'CONFIRM',
            orderId: 'orderId',
        } as ExchangeTrade;

        tradeApi.doExchangeTrade = () => Promise.resolve(tradeResponse);

        const response = await dispatchThunk(store, {
            receiveAddress,
            account,
            trade,
            processResponseData: mockProcessResponseData,
        });

        expect(getExchangeState(store).selectedQuote).toEqual(tradeResponse);
        expect(getExchangeState(store).formStep).toBe('SEND_TRANSACTION');
        expect(response).toEqual(tradeResponse);
    });

    describe('when API returns terminal status (default branch)', () => {
        it('should save trade and set transactionId', async () => {
            const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();

            const dateString = new Date().toISOString();
            jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => dateString);

            const tradeResponse = {
                ...trade,
                status: 'SUCCESS',
                orderId: 'orderId',
            } as ExchangeTrade;

            tradeApi.doExchangeTrade = () => Promise.resolve(tradeResponse);

            const response = await dispatchThunk(store, {
                receiveAddress,
                account,
                trade,
                processResponseData: mockProcessResponseData,
            });

            const { exchange, trades } = getTradingState(store);

            expect(exchange.transactionId).toBe('orderId');
            expect(trades[0]).toEqual({
                tradeType: 'exchange',
                date: dateString,
                data: tradeResponse,
                key: 'orderId',
            });
            expect(response).toEqual(tradeResponse);
        });

        it('should call processResponseData when tradeForm is present', async () => {
            const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();

            jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => 'mock-date');

            const tradeResponse = {
                ...trade,
                status: 'CONFIRMING',
                orderId: 'orderId',
                isDex: true,
                tradeForm: {
                    form: {
                        formMethod: 'GET' as const,
                        formAction: 'action',
                        formTarget: '_blank' as const,
                        fields: { key: 'string' },
                    },
                },
            } as ExchangeTrade;

            tradeApi.doExchangeTrade = () => Promise.resolve(tradeResponse);

            await dispatchThunk(store, {
                receiveAddress,
                account,
                trade,
                processResponseData: mockProcessResponseData,
            });

            expect(mockProcessResponseData).toHaveBeenCalledWith(tradeResponse);
        });

        it('should not call processResponseData when tradeForm is not present', async () => {
            const { store, receiveAddress, account, trade, mockProcessResponseData } = getMocks();

            jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => 'mock-date');

            const tradeResponse = {
                ...trade,
                status: 'SUCCESS',
                orderId: 'orderId',
            } as ExchangeTrade;

            tradeApi.doExchangeTrade = () => Promise.resolve(tradeResponse);

            await dispatchThunk(store, {
                receiveAddress,
                account,
                trade,
                processResponseData: mockProcessResponseData,
            });

            expect(mockProcessResponseData).not.toHaveBeenCalled();
        });
    });
});
