import {
    bnbAsset,
    btcAsset,
    rippleAsset,
    tronAsset,
    tronTetherAsset,
    unknownAsset,
    usdtAsset,
    usdtOnBscAsset,
} from '@suite-native/trading-fixtures';

import { getAssetByEnabledNetworksFilter, getFormDraftKeyByTradeType } from '../utils';

jest.mock('@suite-common/wallet-config', () => {
    const actual = jest.requireActual('@suite-common/wallet-config');

    return {
        ...actual,
        getNetworkByTradeCryptoId: (tradeCryptoId: string) => {
            const network = actual.getNetworkByTradeCryptoId(tradeCryptoId);

            switch (network?.symbol) {
                case 'trx':
                    // mock Tron as debug-only network
                    return {
                        ...network,
                        isDebugOnlyNetwork: true,
                        isExperimentalOnlyNetwork: false,
                    };
                case 'xrp':
                    // mock Ripple as experimental-only network
                    return {
                        ...network,
                        isExperimentalOnlyNetwork: true,
                        isDebugOnlyNetwork: false,
                    };
                default:
                    return network;
            }
        },
        getNetworkByCoingeckoId: (coingeckoId: string) => {
            const network = actual.getNetworkByCoingeckoId(coingeckoId);

            switch (network?.symbol) {
                case 'trx':
                    // mock Tron as debug-only network
                    return {
                        ...network,
                        isDebugOnlyNetwork: true,
                        isExperimentalOnlyNetwork: false,
                    };
                case 'xrp':
                    // mock Ripple as experimental-only network
                    return {
                        ...network,
                        isExperimentalOnlyNetwork: true,
                        isDebugOnlyNetwork: false,
                    };
                default:
                    return network;
            }
        },
    };
});

describe('utils', () => {
    describe('getFormDraftKeyByTradeType', () => {
        it('should return correct form draft key for exchange trade type', () => {
            const result = getFormDraftKeyByTradeType('exchange');
            expect(result).toBe('trading-exchange/');
        });

        it('should return correct form draft key for sell trade type', () => {
            const result = getFormDraftKeyByTradeType('sell');
            expect(result).toBe('trading-sell/');
        });
    });

    describe('getAssetByEnabledNetworksFilter', () => {
        it.each([btcAsset, usdtAsset, tronTetherAsset, tronAsset, bnbAsset, usdtOnBscAsset])(
            `should return true for asset [$symbol] if areDebugOnlyNetworksEnabled FF is enabled`,
            asset => {
                const assetByEnabledNetworksFilter = getAssetByEnabledNetworksFilter(true, false);

                expect(assetByEnabledNetworksFilter(asset)).toBe(true);
            },
        );

        it.each([btcAsset, usdtAsset, rippleAsset])(
            `should return true for asset [$symbol] if areExperimentalOnlyNetworksEnable FF is enabled`,
            asset => {
                const assetByEnabledNetworksFilter = getAssetByEnabledNetworksFilter(false, true);

                expect(assetByEnabledNetworksFilter(asset)).toBe(true);
            },
        );

        it.each([btcAsset, usdtAsset])(
            `should return true for asset [$symbol] if areDebugOnlyNetworksEnabled and areExperimentalOnlyNetworksEnable FFs are disabled`,
            asset => {
                const assetByEnabledNetworksFilter = getAssetByEnabledNetworksFilter(false, false);

                expect(assetByEnabledNetworksFilter(asset)).toBe(true);
            },
        );

        it.each([tronTetherAsset, tronAsset])(
            `should return false for asset [$symbol] if areDebugOnlyNetworksEnabled  FF is disabled`,
            asset => {
                const assetByEnabledNetworksFilter = getAssetByEnabledNetworksFilter(false, true);

                expect(assetByEnabledNetworksFilter(asset)).toBe(false);
            },
        );

        it(`should return false for asset [XRP] if areExperimentalOnlyNetworksEnable FF is disabled`, () => {
            const assetByEnabledNetworksFilter = getAssetByEnabledNetworksFilter(true, false);

            expect(assetByEnabledNetworksFilter(rippleAsset)).toBe(false);
        });

        it('should return false for unknown asset', () => {
            const assetByEnabledNetworksFilter = getAssetByEnabledNetworksFilter(true, true);

            expect(assetByEnabledNetworksFilter(unknownAsset)).toBe(false);
        });
    });
});
