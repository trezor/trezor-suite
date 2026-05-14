import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type SellFiatTrade, type SellFiatTradeResponse } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { type TradingSellState } from '../../../reducers/sellReducer';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import type { LogErrorThunkProps } from '../../common/logErrorThunk';
import { handleSellTradeThunk } from '../handleSellTradeThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

jest.mock('../../common/logErrorThunk', () => ({
    logErrorThunk: (props: LogErrorThunkProps) => ({
        type: 'mockedLogErrorThunk',
        payload: props,
    }),
}));

describe('handleSellTradeThunk', () => {
    const date = new Date('2025-04-09');
    const dateISO = date.toISOString();

    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(date);
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

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
                            ...initialState.sell,
                            quotesRequest: {
                                fiatCurrency: 'USD',
                                cryptoCurrency: 'bitcoin',
                                amount: '100',
                            },
                            sellInfo: {
                                providerInfos: {
                                    provider1: { flow: 'PAYMENT_GATE' },
                                },
                            },
                            ...(initialSellState ?? {}),
                        },
                    },
                },
            },
        });

        const mockProcessResponseData = jest.fn();
        const account = accountBtc as Account;

        const quote: SellFiatTrade = {
            exchange: 'provider1',
            cryptoCurrency: 'bitcoin' as CryptoId,
            fiatCurrency: 'USD',
            cryptoStringAmount: '1',
            rate: 50000,
        };

        return {
            store,
            returnUrl: 'returnUrl',
            account,
            quote,
            mockProcessResponseData,
        };
    };

    describe('should return undefined', () => {
        it.each([
            ['when provider is undefined', { sellInfo: {} }, {}],
            [
                'when quote`s provider was not found',
                {},
                {
                    exchange: 'provider2',
                    cryptoCurrency: 'bitcoin' as CryptoId,
                    fiatCurrency: 'USD',
                    cryptoStringAmount: '1',
                    rate: 50000,
                },
            ],
        ])('%s', async (_, initialSellState, quoteData) => {
            const { store, returnUrl, account, quote, mockProcessResponseData } = getMocks({
                ...(initialSellState as unknown as Partial<TradingSellState>),
            });

            jest.spyOn(invityAPI, 'doSellTrade');

            const result = await store
                .dispatch(
                    handleSellTradeThunk({
                        account,
                        trade: {
                            ...quote,
                            ...quoteData,
                        },
                        returnUrl,
                        processResponseData: mockProcessResponseData,
                    }),
                )
                .unwrap();

            const tradingState = store.getState().wallet.trading;

            expect(invityAPI.doSellTrade).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
            expect(tradingState.sell.transactionId).toBeUndefined();
            expect(tradingState.sell.selectedQuote).toBeUndefined();
            expect(tradingState.trades).toEqual([]);
            expect(mockProcessResponseData).not.toHaveBeenCalled();
        });
    });

    it('should handle no response from the server', async () => {
        const { store, returnUrl, account, quote, mockProcessResponseData } = getMocks();

        invityAPI.doSellTrade = () => Promise.resolve({} as SellFiatTradeResponse);

        const result = await store
            .dispatch(
                handleSellTradeThunk({
                    account,
                    trade: quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const actionToast = store
            .getActions()
            .find(action => action.type === 'mockedLogErrorThunk');
        const tradingState = store.getState().wallet.trading;

        expect(actionToast?.payload).toEqual({
            tradingType: 'sell',
            errorMessage: 'No response from the server',
        });
        expect(result).toBeUndefined();
        expect(tradingState.sell.transactionId).toBeUndefined();
        expect(tradingState.sell.selectedQuote).toBeUndefined();
        expect(tradingState.trades).toEqual([]);
        expect(mockProcessResponseData).not.toHaveBeenCalled();
    });

    it('should handle trade error when status is not LOGIN_REQUEST error is filled', async () => {
        const { store, returnUrl, account, quote, mockProcessResponseData } = getMocks();

        invityAPI.doSellTrade = () =>
            Promise.resolve({
                trade: { error: 'Trade error', status: 'ERROR' },
            } as SellFiatTradeResponse);

        const result = await store
            .dispatch(
                handleSellTradeThunk({
                    account,
                    trade: quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const actionToast = store
            .getActions()
            .find(action => action.type === 'mockedLogErrorThunk');
        const tradingState = store.getState().wallet.trading;

        expect(actionToast?.payload).toEqual({
            tradingType: 'sell',
            errorMessage: 'Trade error',
        });
        expect(result).toBeUndefined();
        expect(tradingState.sell.transactionId).toBeUndefined();
        expect(tradingState.sell.selectedQuote).toBeUndefined();
        expect(tradingState.trades).toEqual([]);
        expect(mockProcessResponseData).not.toHaveBeenCalled();
    });

    it('should return trade from the response and not save data', async () => {
        const { store, returnUrl, account, quote, mockProcessResponseData } = getMocks();
        const quoteData = { status: 'SEND_CRYPTO' };

        invityAPI.doSellTrade = () =>
            Promise.resolve({
                trade: quoteData,
            } as SellFiatTradeResponse);

        const result = await store
            .dispatch(
                handleSellTradeThunk({
                    account,
                    trade: quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();
        const tradingState = store.getState().wallet.trading;

        expect(result).toEqual(quoteData);
        expect(tradingState.sell.transactionId).toBeUndefined();
        expect(tradingState.sell.selectedQuote).toBeUndefined();
        expect(tradingState.trades).toEqual([]);
        expect(mockProcessResponseData).not.toHaveBeenCalled();
    });

    it('should handle payment flow with SUBMITTED status', async () => {
        const { store, returnUrl, account, quote, mockProcessResponseData } = getMocks();

        const mockResponse = {
            trade: {
                status: 'SUBMITTED',
                orderId: 'orderId',
            },
        } as SellFiatTradeResponse;

        invityAPI.doSellTrade = () => Promise.resolve(mockResponse);

        const result = await store
            .dispatch(
                handleSellTradeThunk({
                    account,
                    trade: quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const tradingState = store.getState().wallet.trading;

        expect(result).toBeUndefined();
        expect(tradingState.sell.transactionId).toBe(mockResponse.trade.orderId);
        expect(tradingState.sell.selectedQuote).toEqual(mockResponse.trade);
        expect(tradingState.sell.formStep).toEqual('SEND_TRANSACTION');
        expect(tradingState.trades).toEqual([
            {
                tradeType: 'sell',
                data: mockResponse.trade,
                key: mockResponse.trade.orderId,
                date: dateISO,
                sendAccountKey: 'btc-descriptor-btc',
            },
        ]);
        expect(mockProcessResponseData).not.toHaveBeenCalled();
    });

    it('should call processResponseData when tradeForm is present', async () => {
        const { store, returnUrl, account, quote, mockProcessResponseData } = getMocks();

        const mockResponse = {
            trade: {
                status: 'SUBMITTED',
                orderId: 'orderId',
            },
            tradeForm: {
                form: {
                    formMethod: 'POST',
                    formAction: 'action',
                    fields: { key: 'value' },
                },
            },
        } as SellFiatTradeResponse;

        invityAPI.doSellTrade = () => Promise.resolve(mockResponse);

        const result = await store
            .dispatch(
                handleSellTradeThunk({
                    account,
                    trade: quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const tradingState = store.getState().wallet.trading;

        expect(result).toBeUndefined();
        expect(tradingState.sell.transactionId).toBe(mockResponse.trade.orderId);
        expect(tradingState.sell.selectedQuote).toEqual(mockResponse.trade);
        expect(tradingState.sell.formStep).toEqual('SEND_TRANSACTION');
        expect(tradingState.trades).toEqual([
            {
                tradeType: 'sell',
                data: mockResponse.trade,
                key: mockResponse.trade.orderId,
                date: dateISO,
                sendAccountKey: 'btc-descriptor-btc',
            },
        ]);
        expect(mockProcessResponseData).toHaveBeenCalledTimes(1);
        expect(mockProcessResponseData).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle with different provider flow', async () => {
        const { store, returnUrl, account, quote, mockProcessResponseData } = getMocks({
            sellInfo: {
                providerInfos: {
                    provider2: {
                        name: 'provider2',
                        companyName: 'provider2',
                        logo: 'provider.png',
                        type: 'Fiat',
                        isActive: true,
                        tradedCoins: ['bitcoin'] as CryptoId[],
                        supportedCountries: ['CZ'],
                        flow: 'BANK_ACCOUNT',
                        supportedSubdivisions: {},
                    },
                },
                supportedCryptoCurrencies: ['bitcoin'] as CryptoId[],
                supportedFiatCurrencies: ['USD'],
                country: 'CZ',
            },
        });

        invityAPI.doSellTrade = () =>
            Promise.resolve({
                trade: {
                    status: 'LOGIN_REQUEST',
                },
            });

        const result = await store
            .dispatch(
                handleSellTradeThunk({
                    account,
                    trade: {
                        ...quote,
                        exchange: 'provider2',
                    },
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const tradingState = store.getState().wallet.trading;

        expect(result).toBeUndefined();
        expect(tradingState.sell.transactionId).toBeUndefined();
        expect(tradingState.sell.selectedQuote).toBeUndefined();
        expect(tradingState.sell.formStep).toEqual('BANK_ACCOUNT');
        expect(tradingState.trades).toEqual([]);
        expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
    });
});
