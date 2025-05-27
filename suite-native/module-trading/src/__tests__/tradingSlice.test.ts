import { BuyTrade, CryptoId } from 'invity-api';

import { TrezorDevice } from '@suite-common/suite-types';
import { extraDependenciesMock } from '@suite-common/test-utils';
import { deviceActions } from '@suite-common/wallet-core';

import { getBtcAccount } from '../__fixtures__/account';
import quotes from '../__fixtures__/quotes.json';
import { adaAsset, btcAsset, usdcAsset } from '../__fixtures__/tradeableAssets';
import {
    TradingState,
    addTradeableAssetToFavourites,
    clearTradeOrderIdToBeOpened,
    initialState,
    removeTradeableAssetFromFavourites,
    setBuySelectedReceiveAccount,
    setTradeOrderIdToBeOpened,
    setTradingEnvironment,
    tradingSlice,
} from '../tradingSlice';

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

            expect(state.favouriteAssets).toEqual({});
            expect(state.tradingEnvironment).toBe('production');
        });
    });

    describe('buy', () => {
        it('setBuySelectedReceiveAccount should set selectedReceiveAccount', () => {
            const receiveAccount = { account: getBtcAccount(), address: undefined };
            const state = tradingReducer(
                undefined,
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: receiveAccount,
                }),
            );

            expect(state.buy.selectedReceiveAccount).toBe(receiveAccount);
        });

        it('setBuySelectedReceiveAccount should set and clear selectedReceiveAccount', () => {
            const actions = [
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: getBtcAccount(), address: undefined },
                }),
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: undefined,
                }),
            ];
            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.selectedReceiveAccount).toBeUndefined();
        });

        describe('favouriteAssets', () => {
            it('addTradeableAssetToFavourites should add asset to favourites', () => {
                const actions = [
                    addTradeableAssetToFavourites(btcAsset.cryptoId),
                    addTradeableAssetToFavourites(usdcAsset.cryptoId),
                    addTradeableAssetToFavourites(adaAsset.cryptoId),
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
                        addTradeableAssetToFavourites(btcAsset.cryptoId),
                    );
                });

                it('addTradeableAssetToFavourites should not add same asset twice', () => {
                    const state = tradingReducer(
                        prevState,
                        addTradeableAssetToFavourites(btcAsset.cryptoId),
                    );

                    expect(state.favouriteAssets).toEqual({
                        bitcoin: true,
                    });
                });

                it('removeTradeableAssetFromFavourites should remove asset from favourites', () => {
                    const state = tradingReducer(
                        prevState,
                        removeTradeableAssetFromFavourites(btcAsset.cryptoId),
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
            const state = tradingReducer(undefined, setTradingEnvironment('dev'));

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
            const state = tradingReducer(undefined, setTradeOrderIdToBeOpened('orderId'));

            expect(state.tradeOrderIdToBeOpened).toBe('orderId');
        });
    });

    describe('clearTradeOrderIdToBeOpened', () => {
        it('should clear tradeOrderIdToBeOpened', () => {
            const actions = [setTradeOrderIdToBeOpened('orderId'), clearTradeOrderIdToBeOpened()];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('@suite/device/selectDevice', () => {
        it('should clear selectedReceiveAccount', () => {
            const actions = [
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: getBtcAccount(), address: undefined },
                }),
                deviceActions.selectDevice({ name: 'TEST_DEVICE' } as TrezorDevice),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(state.buy.selectedReceiveAccount).toBeUndefined();
        });
    });
});
