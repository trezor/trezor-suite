import { BuyTrade, CryptoId } from 'invity-api';

import { TrezorDevice } from '@suite-common/suite-types';
import { extraDependenciesMock } from '@suite-common/test-utils';
import { tradingBuyActions } from '@suite-common/trading';
import { deviceActions } from '@suite-common/wallet-core';

import { getBtcAccount } from '../__fixtures__/account';
import quotes from '../__fixtures__/quotes.json';
import { adaAsset, btcAsset, usdcAsset } from '../__fixtures__/tradeableAssets';
import { TradingState, initialState, tradingActions, tradingSlice } from '../tradingSlice';

describe('tradingSlice', () => {
    let tradingReducer: ReturnType<typeof tradingSlice.prepareReducer>;

    beforeEach(() => {
        tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = tradingReducer(undefined, {
                type: 'undefined_action',
            });

            expect(state).toEqual(
                expect.objectContaining({
                    favouriteAssets: {},
                    tradingEnvironment: 'production',
                    isAmountInputActive: false,
                    activeTradingType: undefined,
                }),
            );
        });
    });

    describe('buy', () => {
        it('setBuySelectedReceiveAccount should set selectedReceiveAccount', () => {
            const receiveAccount = { account: getBtcAccount(), address: undefined };
            const state = tradingReducer(
                undefined,
                tradingActions.setBuySelectedReceiveAccount({
                    selectedReceiveAccount: receiveAccount,
                }),
            );

            expect(state.buy.selectedReceiveAccount).toBe(receiveAccount);
        });

        it('setBuySelectedReceiveAccount should set and clear selectedReceiveAccount', () => {
            const actions = [
                tradingActions.setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: getBtcAccount(), address: undefined },
                }),
                tradingActions.setBuySelectedReceiveAccount({
                    selectedReceiveAccount: undefined,
                }),
            ];
            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.selectedReceiveAccount).toBeUndefined();
        });

        describe('favouriteAssets', () => {
            it('addTradeableAssetToFavourites should add asset to favourites', () => {
                const actions = [
                    tradingActions.addTradeableAssetToFavourites(btcAsset.cryptoId),
                    tradingActions.addTradeableAssetToFavourites(usdcAsset.cryptoId),
                    tradingActions.addTradeableAssetToFavourites(adaAsset.cryptoId),
                ];
                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(state.favouriteAssets).toEqual({
                    bitcoin: true,
                    cardano: true,
                    'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': true,
                });
            });

            describe('given state with one favourite asset', () => {
                let prevState: TradingState;

                beforeEach(() => {
                    prevState = tradingReducer(
                        undefined,
                        tradingActions.addTradeableAssetToFavourites(btcAsset.cryptoId),
                    );
                });

                it('addTradeableAssetToFavourites should not add same asset twice', () => {
                    const state = tradingReducer(
                        prevState,
                        tradingActions.addTradeableAssetToFavourites(btcAsset.cryptoId),
                    );

                    expect(state.favouriteAssets).toEqual({
                        bitcoin: true,
                    });
                });

                it('removeTradeableAssetFromFavourites should remove asset from favourites', () => {
                    const state = tradingReducer(
                        prevState,
                        tradingActions.removeTradeableAssetFromFavourites(btcAsset.cryptoId),
                    );

                    expect(state.favouriteAssets).toEqual({});
                });
            });
        });
    });

    describe('tradingEnvironment', () => {
        it('should have production as initial trading environment', () => {
            const state = tradingReducer(undefined, { type: 'undefined_action' });

            expect(state.tradingEnvironment).toBe('production');
        });

        it('setTradingEnvironment should set trading environment and clear buy state', () => {
            const state = tradingReducer(undefined, tradingActions.setTradingEnvironment('dev'));

            expect(state.tradingEnvironment).toBe('dev');
            expect(state.buy).toEqual({
                selectedReceiveAccount: undefined,
                quotesRequest: undefined,
                quotes: [],
                selectedQuote: undefined,
                amountLimits: undefined,
                isFromRedirect: false,
                isLoading: false,
            });
        });
    });

    describe('clearBuyState', () => {
        it('should clear buy state', () => {
            const tradingInitialState = {
                ...initialState,
                buy: {
                    ...initialState.buy,
                    selectedReceiveAccount: { account: getBtcAccount(), address: undefined },
                    quotesRequest: {
                        wantCrypto: true,
                        receiveCurrency: 'btc' as CryptoId,
                        fiatCurrency: 'czk',
                        country: 'CZ',
                    },
                    quotes: quotes as BuyTrade[],
                    selectedQuote: quotes[0],
                    amountLimits: {
                        currency: 'CZK',
                        minFiat: '100',
                    },
                },
            } as TradingState;

            const state = tradingReducer(tradingInitialState, tradingSlice.actions.clearBuyState());

            expect(state.buy).toEqual({
                selectedReceiveAccount: undefined,
                quotesRequest: undefined,
                quotes: [],
                selectedQuote: undefined,
                amountLimits: undefined,
                isFromRedirect: false,
                isLoading: false,
            });
        });
    });

    describe('clearQuotesAndQuotesRequest', () => {
        it('should clear quotes and quotesRequest', () => {
            const tradingInitialState = {
                ...initialState,
                buy: {
                    ...initialState.buy,
                    selectedReceiveAccount: { account: getBtcAccount(), address: undefined },
                    quotesRequest: {
                        wantCrypto: true,
                        receiveCurrency: 'btc' as CryptoId,
                        fiatCurrency: 'czk',
                        country: 'CZ',
                    },
                    quotes: quotes as BuyTrade[],
                    selectedQuote: quotes[0],
                },
            } as TradingState;

            const state = tradingReducer(
                tradingInitialState,
                tradingSlice.actions.clearQuotesAndQuotesRequest(),
            );

            expect(state.buy).toEqual({
                ...tradingInitialState.buy,
                selectedReceiveAccount: expect.any(Object),
                quotesRequest: undefined,
                quotes: [],
                selectedQuote: expect.any(Object),
            });
        });
    });

    describe('tradeOrderIdToBeOpened', () => {
        it('should have undefined as initial tradeOrderIdToBeOpened', () => {
            const state = tradingReducer(undefined, { type: 'undefined_action' });

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });

        it('setTradeOrderIdToBeOpened should set tradeOrderIdToBeOpened', () => {
            const state = tradingReducer(
                undefined,
                tradingActions.setTradeOrderIdToBeOpened('orderId'),
            );

            expect(state.tradeOrderIdToBeOpened).toBe('orderId');
        });
    });

    describe('clearTradeOrderIdToBeOpened', () => {
        it('should clear tradeOrderIdToBeOpened', () => {
            const actions = [
                tradingActions.setTradeOrderIdToBeOpened('orderId'),
                tradingActions.clearTradeOrderIdToBeOpened(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('@suite/device/selectDevice', () => {
        it('should clear selectedReceiveAccount', () => {
            const actions = [
                tradingActions.setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: getBtcAccount(), address: undefined },
                }),
                deviceActions.selectDevice({ name: 'TEST_DEVICE' } as TrezorDevice),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.selectedReceiveAccount).toBeUndefined();
        });
    });

    describe('buyAssetChanged', () => {
        it('should clear selectedReceiveAccount', () => {
            const actions = [
                tradingActions.setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: getBtcAccount(), address: undefined },
                }),
                tradingActions.buyAssetChanged(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.selectedReceiveAccount).toBeUndefined();
        });

        it('should clear buy amountLimits', () => {
            const actions = [
                tradingBuyActions.setAmountLimits({
                    currency: 'CZK',
                    minFiat: '100',
                    maxCrypto: '0.01',
                    maxFiat: '1000',
                    minCrypto: '0.0001',
                }),
                tradingActions.buyAssetChanged(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.amountLimits).toBeUndefined();
        });

        it('should clear quotesRequest', () => {
            const actions = [
                tradingBuyActions.saveQuoteRequest({
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                }),
                tradingActions.buyAssetChanged(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.quotesRequest).toBeUndefined();
        });
    });

    describe('buyFiatCurrencyChanged', () => {
        it('should clear buy amountLimits', () => {
            const actions = [
                tradingBuyActions.setAmountLimits({
                    currency: 'CZK',
                    minFiat: '100',
                    maxCrypto: '0.01',
                    maxFiat: '1000',
                    minCrypto: '0.0001',
                }),
                tradingActions.buyFiatCurrencyChanged(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.amountLimits).toBeUndefined();
        });

        it('should clear quotesRequest', () => {
            const actions = [
                tradingBuyActions.saveQuoteRequest({
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                }),
                tradingActions.buyAssetChanged(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.quotesRequest).toBeUndefined();
        });
    });

    describe('setIsAmountInputActive', () => {
        it('should set isAmountInputActive', () => {
            const actions = [tradingActions.setIsAmountInputActive(true)];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.isAmountInputActive).toBe(true);
        });
    });

    describe('activeTradingType', () => {
        it('setActiveTradingType should set activeTradingType', () => {
            const actions = [
                tradingSlice.actions.setActiveTradingType('exchange'),
                tradingSlice.actions.setActiveTradingType('sell'),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.activeTradingType).toBe('sell');
        });

        it('clearActiveTradingType should should set activeTradingType to undefined', () => {
            const actions = [
                tradingSlice.actions.setActiveTradingType('exchange'),
                tradingSlice.actions.clearActiveTradingType(),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.activeTradingType).toBe(undefined);
        });
    });
});
