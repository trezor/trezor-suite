import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, SellFiatTrade, SellFiatTradeResponse } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { TradingSellState } from '../../../reducers/sellReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { handleSellTradeThunk } from '../handleSellTradeThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

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
                    tradingNew: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    tradingNew: {
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
            ['when quotesRequest is undefined', { quotesRequest: undefined }, {}],
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
                        quote: {
                            ...quote,
                            ...quoteData,
                        },
                        returnUrl,
                        processResponseData: mockProcessResponseData,
                    }),
                )
                .unwrap();

            const tradingState = store.getState().wallet.tradingNew;

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
                    quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const actionToast = store
            .getActions()
            .find(action => action.type === '@common/in-app-notifications/addToast');
        const tradingState = store.getState().wallet.tradingNew;

        expect(actionToast?.payload?.type).toEqual('error');
        expect(actionToast?.payload?.error).toEqual('No response from the server');
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
                    quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const actionToast = store
            .getActions()
            .find(action => action.type === '@common/in-app-notifications/addToast');
        const tradingState = store.getState().wallet.tradingNew;

        expect(actionToast?.payload?.type).toEqual('error');
        expect(actionToast?.payload?.error).toEqual('Trade error');
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
                    quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();
        const tradingState = store.getState().wallet.tradingNew;

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
                    quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const tradingState = store.getState().wallet.tradingNew;

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
                    quote,
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const tradingState = store.getState().wallet.tradingNew;

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
                    quote: {
                        ...quote,
                        exchange: 'provider2',
                    },
                    returnUrl,
                    processResponseData: mockProcessResponseData,
                }),
            )
            .unwrap();

        const tradingState = store.getState().wallet.tradingNew;

        expect(result).toBeUndefined();
        expect(tradingState.sell.transactionId).toBeUndefined();
        expect(tradingState.sell.selectedQuote).toBeUndefined();
        expect(tradingState.sell.formStep).toEqual('BANK_ACCOUNT');
        expect(tradingState.trades).toEqual([]);
        expect(mockProcessResponseData).toHaveBeenCalledTimes(0);
    });
});
