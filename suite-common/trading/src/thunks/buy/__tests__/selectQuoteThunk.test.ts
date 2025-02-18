import { combineReducers } from '@reduxjs/toolkit';
import {
    BuyCryptoPaymentMethod,
    BuyTradeQuoteRequest,
    BuyTradeResponse,
    CryptoId,
    FiatCurrenciesProps,
} from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { buyThunks } from '../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/buyUtils';
import { invityAPI } from '../../../invityAPI';
import { BuyInfo, TradingBuyState } from '../../../reducers/buyReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { SelectQuoteThunk } from '../selectQuoteThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('selectQuoteThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getDataMocks = () => {
        const quote = MIN_MAX_QUOTES_OK[0];
        const quoteExchange = quote.exchange as string;
        const tradedCoin = quote.receiveCurrency as CryptoId;
        const fiat = quote.fiatCurrency as string;
        const country = quote.country as string;
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
        } as unknown as SelectQuoteThunk['timer'];

        const mockNextStep = jest.fn();
        const mockLoginRequest = jest.fn();
        const mockUserConsent = jest.fn(() => Promise.resolve(true));

        return {
            store,
            mockTimer,
            mockTimerStop,
            mockNextStep,
            mockUserConsent,
            mockLoginRequest,
        };
    };

    it('should successful select without need of login', async () => {
        const { quote, state } = getDataMocks();
        const { store, mockTimer, mockNextStep, mockTimerStop, mockUserConsent, mockLoginRequest } =
            getMocks(state);

        await store
            .dispatch(
                buyThunks.selectQuoteThunk({
                    quote,
                    returnUrl: 'returnUrl',
                    timer: mockTimer,
                    loginRequest: mockLoginRequest,
                    userConsent: mockUserConsent,
                    nextStep: mockNextStep,
                }),
            )
            .unwrap();

        expect(mockUserConsent).toHaveBeenCalledTimes(1);
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

            const mockUserConsent = jest.fn(() => Promise.resolve(false));

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote,
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(0);
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

            const mockUserConsent = jest.fn(() => Promise.resolve(false));

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote,
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(0);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when exchange is not found in providerInfos', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } =
                getMocks(state);

            const mockUserConsent = jest.fn(() => Promise.resolve(false));

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
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(0);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when quote receiveCurrency is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } =
                getMocks(state);

            const mockUserConsent = jest.fn(() => Promise.resolve(false));

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
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(0);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when user cancels consent', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockLoginRequest } =
                getMocks(state);

            const mockUserConsent = jest.fn(() => Promise.resolve(false));

            await store
                .dispatch(
                    buyThunks.selectQuoteThunk({
                        quote,
                        returnUrl: 'returnUrl',
                        timer: mockTimer,
                        loginRequest: mockLoginRequest,
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(1);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });
    });

    describe('should not successfully select quote in login flow', () => {
        it('when there is a need of login request before continue', async () => {
            const { quote, tradeForm, state } = getDataMocks();
            const {
                store,
                mockTimer,
                mockNextStep,
                mockTimerStop,
                mockUserConsent,
                mockLoginRequest,
            } = getMocks(state);

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
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(1);
            expect(mockLoginRequest).toHaveBeenCalledTimes(1);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when login response has not tradeForm', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockUserConsent, mockLoginRequest } =
                getMocks(state);

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
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(1);
            expect(mockLoginRequest).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when login response has incorrect status', async () => {
            const { quote, state, tradeForm } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockUserConsent, mockLoginRequest } =
                getMocks(state);

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
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(1);
            expect(mockLoginRequest).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
        });

        it('when login response is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockUserConsent, mockLoginRequest } =
                getMocks(state);

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
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            const actionToast = store
                .getActions()
                .find(action => action.type === '@common/in-app-notifications/addToast');

            expect(mockUserConsent).toHaveBeenCalledTimes(1);
            expect(mockLoginRequest).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.buy.selectedQuote).toEqual(undefined);
            expect(actionToast?.payload?.type).toEqual('error');
            expect(actionToast?.payload?.error).toEqual('No response from the server');
        });
    });
});
