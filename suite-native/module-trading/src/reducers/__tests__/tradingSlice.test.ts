import { BuyTrade, CryptoId } from 'invity-api';

import { TrezorDevice } from '@suite-common/suite-types';
import { extraDependenciesMock } from '@suite-common/test-utils';
import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { deviceActions } from '@suite-common/wallet-core';
import { Address } from '@trezor/blockchain-link-types';

import quotes from '../../__fixtures__/buyQuotes.json';
import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import { sellQuotes } from '../../__fixtures__/sellQuotes';
import { adaAsset, btcAsset, usdcAsset } from '../../__fixtures__/tradeableAssets';
import { buyActions, buyInitialState } from '../buySlice';
import { exchangeActions } from '../exchangeSlice';
import { sellActions, sellInitialState } from '../sellSlice';
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

    describe('tradingEnvironment', () => {
        it('should have production as initial trading environment', () => {
            const state = tradingReducer(undefined, { type: 'undefined_action' });

            expect(state.tradingEnvironment).toBe('production');
        });

        it('should set trading environment', () => {
            const state = tradingReducer(undefined, tradingActions.setTradingEnvironment('dev'));

            expect(state.tradingEnvironment).toBe('dev');
            expect(state.buy).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
            });
        });

        it('should clear buy state', () => {
            const prevState: TradingState = {
                ...initialState,
                buy: {
                    ...buyInitialState,
                    tradingAccountKey: 'account-key',
                    receiveAddress: {
                        address: 'bc1qxyz',
                    } as Address,
                    quotesRequest: {
                        wantCrypto: true,
                        receiveCurrency: 'btc' as CryptoId,
                        fiatCurrency: 'czk',
                        country: 'CZ',
                    },
                    quotes: quotes as BuyTrade[],
                    selectedQuote: quotes[0] as BuyTrade,
                    amountLimits: {
                        currency: 'CZK',
                        minFiat: '100',
                    },
                },
            };

            const state = tradingReducer(prevState, tradingActions.setTradingEnvironment('dev'));

            expect(state.buy).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
            });
        });

        it('should clear sell state', () => {
            const prevState: TradingState = {
                ...initialState,
                sell: {
                    ...sellInitialState,
                    quotes: sellQuotes,
                    tradingAccountKey: 'account-key',
                    quotesRequest: {
                        amountInCrypto: true,
                        cryptoCurrency: 'bitcoin' as CryptoId,
                        fiatStringAmount: '1000',
                        fiatCurrency: 'CZK',
                    },
                    amountLimits: {
                        currency: 'CZK',
                        minFiat: '100',
                    },
                    selectedQuote: sellQuotes[0],
                },
            };

            const state = tradingReducer(prevState, tradingActions.setTradingEnvironment('dev'));

            expect(state.sell).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
                formStep: 'BANK_ACCOUNT',
            });
        });

        it('should clear exchange state', () => {
            const prevState: TradingState = {
                ...initialState,
                exchange: {
                    ...initialState.exchange,
                    quotes: exchangeQuotes,
                },
            };

            const state = tradingReducer(prevState, tradingActions.setTradingEnvironment('dev'));

            expect(state.exchange).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
                formStep: 'RECEIVING_ADDRESS',
            });
        });

        it('should clear tradeOrderIdToBeOpened', () => {
            const prevState: TradingState = {
                ...initialState,
                tradeOrderIdToBeOpened: 'orderId',
            };

            const state = tradingReducer(prevState, tradingActions.setTradingEnvironment('dev'));

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('tradingBuy/clearState', () => {
        it('should clear buy state (buySlice action)', () => {
            const tradingInitialState = {
                ...initialState,
                buy: {
                    ...initialState.buy,
                    quotes: quotes as BuyTrade[],
                },
            } as TradingState;

            const state = tradingReducer(tradingInitialState, buyActions.clearState());

            expect(state.buy.quotes).toEqual([]);
        });

        it('should clear tradeOrderIdToBeOpened', () => {
            const tradingInitialState = {
                ...initialState,
                tradeOrderIdToBeOpened: 'orderId',
            } as TradingState;

            const state = tradingReducer(tradingInitialState, buyActions.clearState());

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('tradingExchange/clearState', () => {
        it('should clear exchange state (exchangeSlice action)', () => {
            const tradingInitialState = {
                ...initialState,
                exchange: {
                    ...initialState.exchange,
                    quotes: exchangeQuotes,
                },
            } as TradingState;

            const state = tradingReducer(tradingInitialState, exchangeActions.clearState());

            expect(state.exchange.quotes).toEqual([]);
        });

        it('should clear tradeOrderIdToBeOpened', () => {
            const tradingInitialState = {
                ...initialState,
                tradeOrderIdToBeOpened: 'orderId',
            } as TradingState;

            const state = tradingReducer(tradingInitialState, exchangeActions.clearState());

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
        });
    });

    describe('tradingSell/clearState', () => {
        it('should clear sell state (sellSlice action)', () => {
            const tradingInitialState = {
                ...initialState,
                sell: {
                    ...sellInitialState,
                    quotes: sellQuotes,
                },
            } as TradingState;

            const state = tradingReducer(tradingInitialState, sellActions.clearState());

            expect(state.sell.quotes).toEqual([]);
        });

        it('should clear tradeOrderIdToBeOpened', () => {
            const tradingInitialState = {
                ...initialState,
                tradeOrderIdToBeOpened: 'orderId',
            } as TradingState;

            const state = tradingReducer(tradingInitialState, sellActions.clearState());

            expect(state.tradeOrderIdToBeOpened).toBeUndefined();
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
        it('should clear receiveAddress', () => {
            const prevState: TradingState = {
                ...initialState,
                buy: {
                    ...initialState.buy,
                    receiveAddress: { address: 'address' } as Address,
                },
                exchange: {
                    ...initialState.exchange,
                    receiveAddress: { address: 'address' } as Address,
                },
            };

            const state = tradingReducer(
                prevState,
                deviceActions.selectDevice({ name: 'TEST_DEVICE' } as TrezorDevice),
            );

            expect(state.buy.receiveAddress).toBeUndefined();
            expect(state.exchange.receiveAddress).toBeUndefined();
        });

        it('should clear buy.tradingAccountKey', () => {
            const actions = [
                tradingBuyActions.setTradingAccountKey('account-key'),
                deviceActions.selectDevice({ name: 'TEST_DEVICE' } as TrezorDevice),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;
            expect(state.buy.tradingAccountKey).toBeUndefined();
        });

        it('should clear exchange.receiveAccountKey', () => {
            const actions = [
                tradingExchangeActions.setReceiveAccountKey('account-key'),
                deviceActions.selectDevice({ name: 'TEST_DEVICE' } as TrezorDevice),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;
            expect(state.exchange.receiveAccountKey).toBeUndefined();
        });

        it('should clear sell.tradingAccountKey', () => {
            const actions = [
                tradingSellActions.setTradingAccountKey('account-key'),
                deviceActions.selectDevice({ name: 'TEST_DEVICE' } as TrezorDevice),
            ];

            const state = actions.reduce(tradingReducer, undefined) as TradingState;
            expect(state.sell.tradingAccountKey).toBeUndefined();
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
