import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeTradeQuoteRequest } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import { exchangeThunks } from '../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { invityAPI } from '../../../invityAPI';
import { type ExchangeInfo, type TradingExchangeState } from '../../../reducers/exchangeReducer';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

describe('selectExchangeQuoteThunk', () => {
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
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        exchange: {
                            ...initialState.exchange,
                            ...(initialExchangeState ?? {}),
                        },
                    },
                },
            },
        });

        const mockNextStep = jest.fn();

        return {
            store,
            mockNextStep,
        };
    };

    it('should successfully select quote', async () => {
        const { quote, state } = getDataMocks();
        const { store, mockNextStep } = getMocks(state);

        await store
            .dispatch(
                exchangeThunks.selectQuoteThunk({
                    quote,
                    nextStep: mockNextStep,
                }),
            )
            .unwrap();

        expect(mockNextStep).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading.quotesTimer.status).toBe('stopped');
        expect(store.getState().wallet.trading.exchange.selectedQuote).toEqual(quote);
    });

    describe('should not be possible to save selected quote', () => {
        it('when exchangeInfo is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockNextStep } = getMocks({
                ...state,
                exchangeInfo: undefined,
            });

            await store
                .dispatch(
                    exchangeThunks.selectQuoteThunk({
                        quote,
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.quotesTimer.status).toBe('idle');
            expect(store.getState().wallet.trading.exchange.selectedQuote).toEqual(undefined);
        });

        it('when quote send is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockNextStep } = getMocks(state);

            await store
                .dispatch(
                    exchangeThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            send: undefined,
                        },
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.quotesTimer.status).toBe('idle');
            expect(store.getState().wallet.trading.exchange.selectedQuote).toEqual(undefined);
        });

        it('when quote receive is undefined', async () => {
            const { quote, state } = getDataMocks();
            const { store, mockNextStep } = getMocks(state);

            await store
                .dispatch(
                    exchangeThunks.selectQuoteThunk({
                        quote: {
                            ...quote,
                            receive: undefined,
                        },
                        nextStep: mockNextStep,
                    }),
                )
                .unwrap();

            expect(mockNextStep).toHaveBeenCalledTimes(0);
            expect(store.getState().wallet.trading.quotesTimer.status).toBe('idle');
            expect(store.getState().wallet.trading.exchange.selectedQuote).toEqual(undefined);
        });
    });
});
