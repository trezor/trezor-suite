import { extraDependenciesMock } from '@suite-common/test-utils';
import { InvityServerEnvironment } from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

import {
    TradingState,
    addTradeableAssetToFavourites,
    initialState,
    removeTradeableAssetFromFavourites,
    selectBuySelectedReceiveAccount,
    selectIsTradingFavouriteAsset,
    selectTradingEnvironment,
    selectTradingFavouriteAssets,
    selectTradingFavouriteAssetsArray,
    setBuySelectedReceiveAccount,
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
                    addTradeableAssetToFavourites({
                        symbol: 'btc',
                        contractAddress: 'abc',
                    } as TradeableAsset),
                    addTradeableAssetToFavourites({
                        symbol: 'btc',
                        contractAddress: 'def',
                        name: 'not really btc',
                    } as TradeableAsset),
                    addTradeableAssetToFavourites({
                        symbol: 'btc',
                    } as TradeableAsset),
                ];
                const state = actions.reduce(tradingReducer, undefined) as TradingState;

                expect(selectTradingFavouriteAssets({ wallet: { tradingNew: state } })).toEqual({
                    btc_abc: {
                        symbol: 'btc',
                        contractAddress: 'abc',
                    },
                    btc_def: {
                        symbol: 'btc',
                        contractAddress: 'def',
                        name: 'not really btc',
                    },
                    btc: {
                        symbol: 'btc',
                    },
                });
            });

            describe('given state with one favourite asset', () => {
                let prevState: TradingState;

                beforeEach(() => {
                    prevState = tradingReducer(
                        undefined,
                        addTradeableAssetToFavourites({ symbol: 'btc' }),
                    );
                });

                it('addTradeableAssetToFavourites should not add same asset twice', () => {
                    const state = tradingReducer(
                        prevState,
                        addTradeableAssetToFavourites({ symbol: 'btc' }),
                    );

                    expect(selectTradingFavouriteAssets({ wallet: { tradingNew: state } })).toEqual(
                        {
                            btc: {
                                symbol: 'btc',
                            },
                        },
                    );
                });

                it('removeTradeableAssetFromFavourites should remove asset from favourites', () => {
                    const state = tradingReducer(
                        prevState,
                        removeTradeableAssetFromFavourites({ symbol: 'btc' }),
                    );

                    expect(selectTradingFavouriteAssets({ wallet: { tradingNew: state } })).toEqual(
                        {},
                    );
                });

                it('selectTradingFavouriteAssetsArray should return memoized array', () => {
                    const state = tradingReducer(
                        prevState,
                        addTradeableAssetToFavourites({ symbol: 'btc' }),
                    );

                    const favouritesArray = selectTradingFavouriteAssetsArray({
                        wallet: { tradingNew: state },
                    });

                    expect(favouritesArray).toEqual([{ symbol: 'btc' }]);
                    expect(
                        selectTradingFavouriteAssetsArray({ wallet: { tradingNew: state } }),
                    ).toBe(favouritesArray);
                });

                it.each([
                    [true, 'btc', undefined],
                    [false, 'eth', undefined],
                    [false, 'eth', 'abc'],
                ] as [boolean, NetworkSymbol, string | undefined][])(
                    'selectIsTradingFavouriteAsset should be [%s] for asset with symbol [%s] and contractAddress [%s]',
                    (expectedValue, symbol, contractAddress) => {
                        const asset = { symbol, contractAddress } as TradeableAsset;

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
    });
});
