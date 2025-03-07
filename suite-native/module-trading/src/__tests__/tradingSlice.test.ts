import { CryptoId } from 'invity-api';

import { extraDependenciesMock } from '@suite-common/test-utils';
import { InvityServerEnvironment, tradingActions } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';

import coins from '../__fixtures__/coins.json';
import platforms from '../__fixtures__/platforms.json';
import { adaAsset, btcAsset, usdcAsset } from '../__fixtures__/tradeableAssets';
import {
    TradingState,
    addTradeableAssetToFavourites,
    initialState,
    removeTradeableAssetFromFavourites,
    selectBuySelectedReceiveAccount,
    selectIsTradingFavouriteAsset,
    selectTradingBuyCoins,
    selectTradingEnvironment,
    selectTradingFavouriteAssets,
    selectTradingFavouriteAssetsArray,
    setBuySelectedReceiveAccount,
    setTradingEnvironment,
    tradingSlice,
} from '../tradingSlice';
import { TradeableAsset } from '../types';

const getBtcAccount = () =>
    ({
        symbol: 'btc',
        accountType: 'normal',
        accountLabel: 'BTC Account',
        addresses: {
            used: [
                {
                    address: '1BTC',
                    path: 'm/84/0/0',
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
            change: [],
            unused: [],
        },
    }) as unknown as Account;

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

            expect(state.buy.selectedReceiveAccount).toBeUndefined();
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

            expect(selectBuySelectedReceiveAccount({ wallet: { tradingNew: state } })).toBe(
                receiveAccount,
            );
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

            expect(
                selectBuySelectedReceiveAccount({ wallet: { tradingNew: state } }),
            ).toBeUndefined();
        });

        describe('favouriteAssets', () => {
            it('addTradeableAssetToFavourites should add asset to favourites', () => {
                const actions = [
                    addTradeableAssetToFavourites(btcAsset),
                    addTradeableAssetToFavourites(usdcAsset),
                    addTradeableAssetToFavourites(adaAsset),
                ];
                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(selectTradingFavouriteAssets({ wallet: { tradingNew: state } })).toEqual({
                    bitcoin: btcAsset,
                    cardano: adaAsset,
                    'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': usdcAsset,
                });
            });

            describe('given state with one favourite asset', () => {
                let prevState: TradingState;

                beforeEach(() => {
                    prevState = tradingReducer(undefined, addTradeableAssetToFavourites(btcAsset));
                });

                it('addTradeableAssetToFavourites should not add same asset twice', () => {
                    const state = tradingReducer(
                        prevState,
                        addTradeableAssetToFavourites(btcAsset),
                    );

                    expect(selectTradingFavouriteAssets({ wallet: { tradingNew: state } })).toEqual(
                        {
                            bitcoin: expect.objectContaining({ coingeckoId: 'bitcoin' }),
                        },
                    );
                });

                it('removeTradeableAssetFromFavourites should remove asset from favourites', () => {
                    const state = tradingReducer(
                        prevState,
                        removeTradeableAssetFromFavourites(btcAsset),
                    );

                    expect(selectTradingFavouriteAssets({ wallet: { tradingNew: state } })).toEqual(
                        {},
                    );
                });

                it('selectTradingFavouriteAssetsArray should return memoized array', () => {
                    const state = tradingReducer(
                        prevState,
                        addTradeableAssetToFavourites(btcAsset),
                    );

                    const favouritesArray = selectTradingFavouriteAssetsArray({
                        wallet: { tradingNew: state },
                    });

                    expect(favouritesArray).toEqual([btcAsset]);
                    expect(
                        selectTradingFavouriteAssetsArray({ wallet: { tradingNew: state } }),
                    ).toBe(favouritesArray);
                });

                it.each([
                    [true, 'bitcoin'],
                    [false, 'eth'],
                    [false, 'eth__0x0000000000000000000000000000000000000000'],
                ] as [boolean, CryptoId][])(
                    'selectIsTradingFavouriteAsset should be [%s] for asset with cryptoId [%s] ',
                    (expectedValue, cryptoId) => {
                        const asset = { cryptoId } as unknown as TradeableAsset;

                        expect(
                            selectIsTradingFavouriteAsset(
                                { wallet: { tradingNew: prevState } },
                                asset,
                            ),
                        ).toBe(expectedValue);
                    },
                );
            });
        });

        describe('selectTradeableCoins', () => {
            let prevState: TradingState;

            beforeEach(() => {
                prevState = tradingReducer(
                    undefined,
                    tradingActions.saveInfo({ coins, platforms }),
                );
            });

            it('should select only coins with buy set to true', () => {
                expect(selectTradingBuyCoins({ wallet: { tradingNew: prevState } })).toEqual([
                    expect.objectContaining({ cryptoId: 'bitcoin' }),
                    expect.objectContaining({ cryptoId: 'ethereum' }),
                    expect.objectContaining({
                        cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    }),
                    expect.objectContaining({
                        cryptoId: 'base--0x0000000000000000000000000000000000000000',
                    }),
                ]);
            });

            it('should be stable', () => {
                const first = selectTradingBuyCoins({ wallet: { tradingNew: prevState } });
                const second = selectTradingBuyCoins({ wallet: { tradingNew: prevState } });

                expect(first).toBe(second);
            });

            it('should be empty array when coins are not set', () => {
                prevState = tradingReducer(undefined, { type: 'undefined_action' });

                expect(selectTradingBuyCoins({ wallet: { tradingNew: prevState } })).toEqual([]);
            });
        });
    });

    describe('tradingEnvironment', () => {
        it('should have production as initial trading environment', () => {
            const state = tradingReducer(undefined, { type: 'undefined_action' });

            expect(selectTradingEnvironment({ wallet: { tradingNew: state } })).toBe('production');
        });

        it('should correctly select trading environment', () => {
            const state = {
                ...initialState,
                tradingEnvironment: 'staging' as InvityServerEnvironment,
            };

            expect(selectTradingEnvironment({ wallet: { tradingNew: state } })).toBe('staging');
        });

        it('setTradingEnvironment should set trading environment', () => {
            const state = tradingReducer(undefined, setTradingEnvironment('dev'));

            expect(selectTradingEnvironment({ wallet: { tradingNew: state } })).toBe('dev');
        });
    });
});
