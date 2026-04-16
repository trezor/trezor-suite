import { combineReducers } from '@reduxjs/toolkit';
import {
    type BuyCryptoPaymentMethod,
    type BuyTradeQuoteRequest,
    type BuyTradeResponse,
    type CryptoId,
    type FiatCurrenciesProps,
    type FiatCurrencyCode,
} from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/buyUtils';
import { invityAPI } from '../../../invityAPI';
import { type BuyInfo, type TradingBuyState } from '../../../reducers/buyReducer';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { type TradingCountryCode } from '../../../types';
import type { LogErrorThunkProps } from '../../common/logErrorThunk';
import { buyThunks } from '../index';
import { type SelectBuyQuoteThunkProps } from '../selectBuyQuoteThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

jest.mock('../../common/logErrorThunk', () => ({
    logErrorThunk: (props: LogErrorThunkProps) => ({
        type: 'mockedLogErrorThunk',
        payload: props,
    }),
}));

describe('selectBuyQuoteThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getDataMocks = () => {
        const quote = MIN_MAX_QUOTES_OK[0];
        if (!quote) throw new Error('Missing test fixture');
        const quoteExchange = quote.exchange as string;
        const tradedCoin = quote.receiveCurrency as CryptoId;
        const fiat = quote.fiatCurrency as FiatCurrencyCode;
        const country = quote.country as TradingCountryCode;
        const cryptoStringAmount = quote.receiveStringAmount as string;

        const buyInfo: BuyInfo = {
            buyInfo: {
                country,
                suggestedFiatCurrency: fiat,
                providers: [],
                defaultAmountsOfFiatCurrencies: {
                    czk: 2500,
                } as FiatCurrenciesProps,
            },
            providerInfos: {
                [quoteExchange]: {
                    name: quoteExchange,
                    logo: quoteExchange,
                    companyName: quoteExchange,
                    isActive: true,
                    tradedCoins: [tradedCoin],
                    paymentMethods: [quote.paymentMethod as BuyCryptoPaymentMethod],
                    tradedFiatCurrencies: [fiat],
                    supportedCountries: [country],
                    supportedSubdivisions: {},
                },
            },
            supportedFiatCurrencies: [fiat],
            supportedCryptoCurrencies: [tradedCoin],
        };

        const quotesRequest: BuyTradeQuoteRequest = {
            country,
            cryptoStringAmount,
            fiatCurrency: fiat,
            fiatStringAmount: undefined,
            receiveCurrency: tradedCoin,
            wantCrypto: false,
        };

        const tradeForm = {
            form: {
                formMethod: 'GET' as const,
                formAction: 'action',
                formTarget: '_blank' as const,
                fields: {
                    key: 'string',
                },
            },
        };

        return {
            quote,
            tradeForm,

            state: {
                buyInfo,
                quotesRequest,
            },
        };
    };

    const getMocks = (initialBuyState?: Partial<TradingBuyState>) => {
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
                        buy: {
                            ...initialState.buy,
                            ...(initialBuyState ?? {}),
                        },
                    },
                },
            },
        });

        const mockTimerStop = jest.fn();
        const mockTimer = {
            stop: mockTimerStop,
        } as unknown as SelectBuyQuoteThunkProps['timer'];

        const mockNextStep = jest.fn();
        const mockLoginRequest = jest.fn();

        return {
            store,
            mockTimer,
            mockTimerStop,
            mockNextStep,
            mockLoginRequest,
        };
    };

    it('should successful select without need of login', async () => {
        const { quote, state } = getDataMocks();
        const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } = getMocks(state);

        await store
            .dispatch(
                buyThunks.selectQuoteThunk({
                    quote,
                    returnUrl: 'returnUrl',
                    timer: mockTimer,
                    loginRequest: mockLoginRequest,
                    nextStep: mockNextStep,
                }),
            )
            .unwrap();

        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(quote);
    });

    describe('should not be possible to save selected quote', () => {
        it('when buyInfo is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } = getMocks({
                ...state,
                buyInfo: undefined,
            });

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote,
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when quotesRequest is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } = getMocks({
                ...state,
                quotesRequest: undefined,
            });

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote,
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when exchange is not found in providerInfos', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } =
                getMocks(state);

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            exchange: 'random',
                        },
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when quote receiveCurrency is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } =
                getMocks(state);

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            receiveCurrency: undefined,
                        },
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });
    });

    describe('should not successfully select quote in login flow', () => {
        it('when there is a need of login request before continue', async () => {
            const { quote, tradeForm, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } =
                getMocks(state);

            const buyTradeResponse: BuyTradeResponse = {
                trade: {
                    ...quote,
                    status: 'LOGIN_REQUEST' as const,
                },
                tradeForm,
            };

            invityAPI.doBuyTrade = () => Promise.resolve(buyTradeResponse);

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            quoteId: undefined,
                        },
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockLoginRequest).toHaveBeenCalledTimes(1);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when login response has not tradeForm', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockLoginRequest } = getMocks(state);

            const buyTradeResponse = {
                trade: {
                    ...quote,
                    status: 'LOGIN_REQUEST' as const,
                },
            };

            invityAPI.doBuyTrade = () => Promise.resolve(buyTradeResponse);

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            quoteId: undefined,
                        },
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockLoginRequest).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when login response has incorrect status', async () => {
            const { quote, state, tradeForm } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockLoginRequest } = getMocks(state);

            const buyTradeResponse = {
                trade: {
                    ...quote,
                    status: 'APPROVAL_PENDING' as const,
                },
                tradeForm,
            };

            invityAPI.doBuyTrade = () => Promise.resolve(buyTradeResponse);

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            quoteId: undefined,
                        },
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockLoginRequest).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when login response is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockLoginRequest } = getMocks(state);

            invityAPI.doBuyTrade = () => Promise.resolve(undefined as unknown as BuyTradeResponse);

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            quoteId: undefined,
                        },
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            const actionToast = store
                .getActions()
                .find(action => action.type === 'mockedLogErrorThunk');

            expect(mockLoginRequest).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
            expect(actionToast?.payload).toEqual({
                errorMessage: 'No response from the server',
                tradingType: 'buy',
            });
        });
    });
});
