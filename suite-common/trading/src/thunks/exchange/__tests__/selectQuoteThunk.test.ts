import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, ExchangeTradeQuoteRequest } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { exchangeThunks } from '../../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { invityAPI } from '../../../invityAPI';
import { ExchangeInfo, TradingExchangeState } from '../../../reducers/exchangeReducer';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { SelectQuoteThunkProps } from '../../exchange/selectQuoteThunk';

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
        const send = quote.send as CryptoId;
        const receive = quote.receive as CryptoId;

        const exchangeInfo: ExchangeInfo = {
            exchangeList: [],
            buyCryptoIds: [send],
            sellCryptoIds: [receive],

            providerInfos: {
                [quoteExchange]: {
                    name: quoteExchange,
                    companyName: quoteExchange,
                    logo: quoteExchange,
                    isActive: true,
                    isFixedRate: false,
                    isDex: false,
                    buyTickers: [send],
                    sellTickers: [receive],
                    supportUrl: 'https://support.exchange.io',
                    kycPolicyType: 'KYC-yesrefund',
                    addressFormats: {
                        BCH: 'legacy',
                    },
                    statusUrl: 'https://exchange.io/exchange/txs/{{orderId}}',
                    kycUrl: 'https://exchange.io/faq#kyc',
                    kycPolicy:
                        'KYC requested in exceptional cases. KYC may be required for refunds. 🤝',
                    isRefundRequired: false,
                },
            },
        };

        const quotesRequest: ExchangeTradeQuoteRequest = {
            send,
            receive,
            sendStringAmount: quote.sendStringAmount,
            dex: 'enable',
        };

        return {
            quote,
            state: {
                exchangeInfo,
                quotesRequest,
            },
        };
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
                            ...(initialExchangeState ?? {}),
                        },
                    },
                },
            },
        });

        const mockTimerStop = jest.fn();
        const mockTimer = {
            stop: mockTimerStop,
        } as unknown as SelectQuoteThunkProps['timer'];

        const mockNextStep = jest.fn();
        const mockUserConsent = jest.fn(() => Promise.resolve(true));

        return {
            store,
            mockTimer,
            mockTimerStop,
            mockNextStep,
            mockUserConsent,
        };
    };

    it('should successful select quote', async () => {
        const { quote, state } = getDataMocks();
        const { store, mockTimer, mockNextStep, mockTimerStop, mockUserConsent } = getMocks(state);

        await store
            .dispatch(
                exchangeThunks.selectQuoteThunk({
                    quote,
                    timer: mockTimer,
                    userConsent: mockUserConsent,
                    nextStep: mockNextStep,
                }),
            )
            .unwrap();

        expect(mockUserConsent).toHaveBeenCalledTimes(1);
        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.tradingNew.exchange.selectedQuote).toEqual(quote);
    });

    describe('should not be possible to save selected quote', () => {
        it('when exchangeInfo is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockUserConsent } = getMocks({
                ...state,
                exchangeInfo: undefined,
            });

            await store
                .dispatch(
                    exchangeThunks.selectQuoteThunk({
                        quote,
                        timer: mockTimer,
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(0);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.exchange.selectedQuote).toEqual(undefined);
        });

        it('when quoteRequest is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockUserConsent } = getMocks({
                ...state,
                quotesRequest: undefined,
            });

            await store
                .dispatch(
                    exchangeThunks.selectQuoteThunk({
                        quote,
                        timer: mockTimer,
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(0);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.exchange.selectedQuote).toEqual(undefined);
        });

        it('when quote send is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockUserConsent } =
                getMocks(state);

            await store
                .dispatch(
                    exchangeThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            send: undefined,
                        },
                        timer: mockTimer,
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(0);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.exchange.selectedQuote).toEqual(undefined);
        });

        it('when quote receive is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop, mockUserConsent } =
                getMocks(state);

            await store
                .dispatch(
                    exchangeThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            receive: undefined,
                        },
                        timer: mockTimer,
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(0);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.exchange.selectedQuote).toEqual(undefined);
        });

        it('when user cancels consent', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockTimer, mockNextStep, mockTimerStop } = getMocks(state);

            const mockUserConsent = jest.fn(() => Promise.resolve(false));

            await store
                .dispatch(
                    exchangeThunks.selectQuoteThunk({
                        quote,
                        timer: mockTimer,
                        userConsent: mockUserConsent,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockUserConsent).toHaveBeenCalledTimes(1);
            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(mockTimerStop).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.tradingNew.exchange.selectedQuote).toEqual(undefined);
        });
    });
});
