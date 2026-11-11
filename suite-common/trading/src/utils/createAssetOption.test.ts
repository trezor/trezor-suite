import { type CryptoId } from 'invity-api';

import { mockNetworkMetadata } from '@suite-common/networks/mocks';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { createAssetOption } from './createAssetOption';
import platforms from '../__fixtures__/platforms.json';

const bitcoinConfig = { ...mockNetworkMetadata.btc, ...getNetwork(asNetworkSymbol('btc')) };
const ethereumConfig = { ...mockNetworkMetadata.eth, ...getNetwork(asNetworkSymbol('eth')) };
const baseConfig = { ...mockNetworkMetadata.base, ...getNetwork(asNetworkSymbol('base')) };
const networkConfigs = [bitcoinConfig, ethereumConfig, baseConfig];

describe('createAssetOption', () => {
    it.each([
        ['testnet', { testnet: true }],
        ['missing CoinGecko ID', { coingeckoId: undefined }],
        ['missing trading ID', { tradeCryptoId: undefined }],
    ] as const)('rejects a native asset with %s', (_, overrides) => {
        expect(
            createAssetOption({
                cryptoId: 'bitcoin' as CryptoId,
                networkConfigs: [{ ...bitcoinConfig, ...overrides }],
            }),
        ).toBeNull();
    });

    it('rejects an asset before network configs are loaded', () => {
        expect(
            createAssetOption({
                cryptoId: 'bitcoin' as CryptoId,
                networkConfigs: [],
            }),
        ).toBeNull();
    });

    it('accepts a native asset registered outside the legacy network list', () => {
        const symbol = asNetworkSymbol('new-network');

        expect(
            createAssetOption({
                cryptoId: 'new-network' as CryptoId,
                networkConfigs: [
                    {
                        ...bitcoinConfig,
                        symbol,
                        name: 'New Network',
                        displaySymbol: 'NEW',
                        coingeckoId: 'new-network',
                        tradeCryptoId: 'new-network',
                    },
                ],
            }),
        ).toMatchObject({
            isNativeToken: true,
            networkSymbol: symbol,
            networkName: 'New Network',
        });
    });

    it.each([
        ['testnet', { testnet: true }],
        ['missing CoinGecko ID', { coingeckoId: undefined }],
    ] as const)('rejects a token with %s', (_, overrides) => {
        const cryptoId = 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                networkConfigs: [{ ...ethereumConfig, ...overrides }],
                platformInfo: platforms.ethereum,
            }),
        ).toBeNull();
    });

    it('rejects a token on an unsupported platform', () => {
        const cryptoId = 'unknown--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId;

        expect(
            createAssetOption({
                cryptoId,
                networkConfigs,
                platformInfo: { ...platforms.ethereum, nativeCoinSymbol: 'unknown' },
            }),
        ).toBeNull();
    });

    it('rejects an unrecognized native asset without a token contract', () => {
        expect(
            createAssetOption({
                cryptoId: 'unknown' as CryptoId,
                networkConfigs,
                platformInfo: platforms.ethereum,
            }),
        ).toBeNull();
    });

    it('should return correct data for Bitcoin', () => {
        expect(
            createAssetOption({
                cryptoId: 'bitcoin' as CryptoId,
                networkConfigs,
            }),
        ).toEqual({
            isNativeToken: true,
            id: 'bitcoin',
            coingeckoId: 'bitcoin',
            contractAddress: null,
            networkName: 'Bitcoin',
            networkSymbol: 'btc',
        });
    });

    it('should return correct data for Ethereum on the base network', () => {
        const cryptoId = 'base--0x0000000000000000000000000000000000000000';
        const platformInfo = platforms.base;

        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                networkConfigs,
                platformInfo,
            }),
        ).toEqual({
            isNativeToken: true,
            id: 'base--0x0000000000000000000000000000000000000000',
            coingeckoId: 'base',
            contractAddress: '0x0000000000000000000000000000000000000000',
            networkName: 'Base',
            networkSymbol: 'base',
        });
    });

    it('should return correct data for Ethereum Base Protocol token data', () => {
        const cryptoId = 'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc';
        const platformInfo = platforms.base;

        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                networkConfigs,
                platformInfo,
            }),
        ).toEqual({
            isNativeToken: false,
            id: 'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc',
            coingeckoId: 'ethereum',
            contractAddress: '0x07150e919b4de5fd6a63de1f9384828396f25fdc',
            networkName: 'Ethereum',
            networkSymbol: 'eth',
        });
    });

    it('should return correct data for Ethereum USDC token data', () => {
        const cryptoId = 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        const platformInfo = platforms.base;

        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                networkConfigs,
                platformInfo,
            }),
        ).toEqual({
            isNativeToken: false,
            id: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            coingeckoId: 'ethereum',
            contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            networkName: 'Ethereum',
            networkSymbol: 'eth',
        });
    });

    it('should return correct data for awsteth token data', () => {
        const cryptoId = 'ethereum--0x0b925ed163218f6662a35e0f0371ac234f9e9371';
        const platformInfo = platforms.base;

        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                networkConfigs,
                platformInfo,
            }),
        ).toEqual({
            coingeckoId: 'ethereum',
            contractAddress: '0x0b925ed163218f6662a35e0f0371ac234f9e9371',
            id: 'ethereum--0x0b925ed163218f6662a35e0f0371ac234f9e9371',
            isNativeToken: false,
            networkName: 'Ethereum',
            networkSymbol: 'eth',
        });
    });
});
