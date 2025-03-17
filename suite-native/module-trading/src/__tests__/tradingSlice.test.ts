import { extraDependenciesMock } from '@suite-common/test-utils';

import { getBtcAccount } from '../__fixtures__/account';
import { adaAsset, btcAsset, usdcAsset } from '../__fixtures__/tradeableAssets';
import {
    TradingState,
    addTradeableAssetToFavourites,
    removeTradeableAssetFromFavourites,
    setBuySelectedReceiveAccount,
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

        it('setTradingEnvironment should set trading environment', () => {
            const state = tradingReducer(undefined, setTradingEnvironment('dev'));

            expect(state.tradingEnvironment).toBe('dev');
        });
    });
});
