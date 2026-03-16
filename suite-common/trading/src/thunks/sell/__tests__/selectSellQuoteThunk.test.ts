import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type SellFiatTradeQuoteRequest } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import { sellThunks } from '../';
import { invityAPI } from '../../../invityAPI';
import { type SellInfo, type TradingSellState } from '../../../reducers/sellReducer';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { sellUtilsFixtures } from '../../../utils/sell/__fixtures__/sellUtils';
import { type SelectSellQuoteThunkProps } from '../selectSellQuoteThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

describe('selectSellQuoteThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getDataMocks = () => {
        const quote = sellUtilsFixtures.MIN_MAX_QUOTES_LOW[0];
        const quoteExchange = quote.exchange as string;
        const cryptoCurrency = quote.cryptoCurrency as CryptoId;
        const fiatCurrency = quote.fiatCurrency as string;

        const sellInfo: SellInfo = {
            supportedCryptoCurrencies: [cryptoCurrency],
            supportedFiatCurrencies: [fiatCurrency],

            providerInfos: {
                [quoteExchange]: {
                    name: quoteExchange,
                    companyName: quoteExchange,
                    logo: quoteExchange,
                    isActive: true,
                    statusUrl: 'https://test.io/sell/txs/{{orderId}}',
                    supportUrl: 'https://support.test.io',
                    tradedCoins: ['bitcoin' as CryptoId],
                    tradedFiatCurrencies: ['CZK', 'USD'],
                    type: 'Fiat',
                    supportedCountries: ['CZ'],
                    flow: 'BANK_ACCOUNT',
                    supportedSubdivisions: {},
                },
            },
            country: 'CZ',
        };

        const quotesRequest: SellFiatTradeQuoteRequest = {
            fiatCurrency,
            cryptoCurrency,
            cryptoStringAmount: quote.cryptoStringAmount,
            amountInCrypto: false,
        };

        return {
            quote,
            state: {
                sellInfo,
                quotesRequest,
            },
        };
    };

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
                            ...(initialSellState ?? {}),
                        },
                    },
                },
            },
        });

        const mockTimerStop = jest.fn();
        const mockTimer = {
            stop: mockTimerStop,
        } as unknown as SelectSellQuoteThunkProps['timer'];

        const mockNextStep = jest.fn();

        return {
            store,
            mockTimer,
            mockTimerStop,
            mockNextStep,
        };
    };

    it('should successfully select quote', async () => {
        const { quote, state } = getDataMocks();
        const { store, mockTimer, mockNextStep, mockTimerStop } = getMocks(state);

        await store
            .dispatch(
                sellThunks.selectQuoteThunk({
                    quote,
                    timer: mockTimer,
                    nextStep: mockNextStep,
                }),
            )
            .unwrap();

        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading.sell.selectedQuote).toEqual(quote);
    });

    describe('should not be possible to save selected quote', () => {
        it('when sellInfo is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop } = getMocks({
                ...state,
                sellInfo: undefined,
            });

            await store
                .dispatch(
                    sellThunks.selectQuoteThunk({
                        quote,
                        timer: mockTimer,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.sell.selectedQuote).toEqual(undefined);
        });

        it('when quote exchange is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop } = getMocks({
                ...state,
                quotesRequest: undefined,
            });

            await store
                .dispatch(
                    sellThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            exchange: undefined,
                        },
                        timer: mockTimer,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.sell.selectedQuote).toEqual(undefined);
        });

        it('when quoteRequest is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop } = getMocks({
                ...state,
                quotesRequest: undefined,
            });

            await store
                .dispatch(
                    sellThunks.selectQuoteThunk({
                        quote,
                        timer: mockTimer,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.sell.selectedQuote).toEqual(undefined);
        });

        it('when quote cryptoCurrency is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop } = getMocks(state);

            await store
                .dispatch(
                    sellThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            cryptoCurrency: undefined,
                        },
                        timer: mockTimer,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.sell.selectedQuote).toEqual(undefined);
        });
    });
});
