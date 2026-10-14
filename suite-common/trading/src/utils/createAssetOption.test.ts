import { type CryptoId } from 'invity-api';

import { mockNetworkMetadata } from '@suite-common/networks/mocks';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { createAssetOption } from './createAssetOption';
import coins from '../__fixtures__/coins.json';
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
                coinInfo: coins.bitcoin,
                networkConfigs: [{ ...bitcoinConfig, ...overrides }],
            }),
        ).toBeNull();
    });

    it('uses the display symbol supplied by the network config', () => {
        expect(
            createAssetOption({
                cryptoId: 'bitcoin' as CryptoId,
                coinInfo: coins.bitcoin,
                networkConfigs: [{ ...bitcoinConfig, displaySymbol: 'MODULE_BTC' }],
            }),
        ).toMatchObject({ displaySymbol: 'MODULE_BTC' });
    });

    it('rejects an asset before network configs are loaded', () => {
        expect(
            createAssetOption({
                cryptoId: 'bitcoin' as CryptoId,
                coinInfo: coins.bitcoin,
                networkConfigs: [],
            }),
        ).toBeNull();
    });

    it('accepts a native asset registered outside the legacy network list', () => {
        const symbol = asNetworkSymbol('new-network');

        expect(
            createAssetOption({
                cryptoId: 'new-network' as CryptoId,
                coinInfo: coins.bitcoin,
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
            symbol,
            networkSymbol: symbol,
            networkName: 'New Network',
            displaySymbol: 'NEW',
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
                coinInfo: coins[cryptoId],
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
                coinInfo: coins.bitcoin,
                networkConfigs,
                platformInfo: { ...platforms.ethereum, nativeCoinSymbol: 'unknown' },
            }),
        ).toBeNull();
    });

    it('rejects an unrecognized native asset without a token contract', () => {
        expect(
            createAssetOption({
                cryptoId: 'unknown' as CryptoId,
                coinInfo: coins.bitcoin,
                networkConfigs,
                platformInfo: platforms.ethereum,
            }),
        ).toBeNull();
    });

    it('should return correct data for Bitcoin', () => {
        const coinInfo = coins.bitcoin;

        expect(
            createAssetOption({
                cryptoId: 'bitcoin' as CryptoId,
                coinInfo,
                networkConfigs,
            }),
        ).toEqual({
            isNativeToken: true,
            id: 'bitcoin',
            name: 'Bitcoin',
            coingeckoId: 'bitcoin',
            symbol: 'btc',
            displaySymbol: 'BTC',
            contractAddress: null,
            networkName: 'Bitcoin',
            networkSymbol: 'btc',
            displaySymbolName: 'Bitcoin',
        });
    });

    it('should return correct data for Ethereum on the base network', () => {
        const cryptoId = 'base--0x0000000000000000000000000000000000000000';
        const coinInfo = coins[cryptoId];
        const platformInfo = platforms.base;

        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                coinInfo,
                networkConfigs,
                platformInfo,
            }),
        ).toEqual({
            isNativeToken: true,
            id: 'base--0x0000000000000000000000000000000000000000',
            name: 'Base',
            coingeckoId: 'base',
            symbol: 'base',
            displaySymbol: 'ETH',
            contractAddress: '0x0000000000000000000000000000000000000000',
            networkName: 'Base',
            networkSymbol: 'base',
            displaySymbolName: 'Base Ethereum',
        });
    });

    it('should return correct data for Ethereum Base Protocol token data', () => {
        const cryptoId = 'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc';
        const coinInfo = coins[cryptoId];
        const platformInfo = platforms.base;

        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                coinInfo,
                networkConfigs,
                platformInfo,
            }),
        ).toEqual({
            isNativeToken: false,
            id: 'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc',
            name: 'Base Protocol',
            symbol: 'base',
            coingeckoId: 'ethereum',
            displaySymbol: 'BASE',
            contractAddress: '0x07150e919b4de5fd6a63de1f9384828396f25fdc',
            networkName: 'Ethereum',
            networkSymbol: 'eth',
            displaySymbolName: 'Base Protocol',
        });
    });

    it('should return correct data for Ethereum USDC token data', () => {
        const cryptoId = 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        const coinInfo = coins[cryptoId];
        const platformInfo = platforms.base;

        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                coinInfo,
                networkConfigs,
                platformInfo,
            }),
        ).toEqual({
            isNativeToken: false,
            id: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            name: 'USDC',
            symbol: 'usdc',
            coingeckoId: 'ethereum',
            displaySymbol: 'USDC',
            contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            networkName: 'Ethereum',
            networkSymbol: 'eth',
            displaySymbolName: 'USDC',
        });
    });

    it('should return correct data for awsteth token data', () => {
        const cryptoId = 'ethereum--0x0b925ed163218f6662a35e0f0371ac234f9e9371';
        const coinInfo = coins[cryptoId];
        const platformInfo = platforms.base;

        expect(
            createAssetOption({
                cryptoId: cryptoId as CryptoId,
                coinInfo,
                networkConfigs,
                platformInfo,
            }),
        ).toEqual({
            coingeckoId: 'ethereum',
            contractAddress: '0x0b925ed163218f6662a35e0f0371ac234f9e9371',
            displaySymbol: 'AWSTETH',
            displaySymbolName: 'Aave v3 wstETH',
            id: 'ethereum--0x0b925ed163218f6662a35e0f0371ac234f9e9371',
            isNativeToken: false,
            name: 'Aave v3 wstETH',
            networkName: 'Ethereum',
            networkSymbol: 'eth',
            symbol: 'awsteth',
        });
    });
});
