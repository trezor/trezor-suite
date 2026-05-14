import { type CryptoId } from 'invity-api';

import coins from '../../__fixtures__/coins.json';
import platforms from '../../__fixtures__/platforms.json';
import { createAssetOption } from '../useTradingAssets';

describe('createAssetOption', () => {
    it('should return correct data for Bitcoin', () => {
        const coinInfo = coins.bitcoin;

        expect(
            createAssetOption({
                cryptoId: 'bitcoin' as CryptoId,
                coinInfo,
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
                platformInfo,
            }),
        ).toEqual({
            coingeckoId: 'ethereum',
            contractAddress: '0x0b925ed163218f6662a35e0f0371ac234f9e9371',
            displaySymbol: 'AWSTETH',
            id: 'ethereum--0x0b925ed163218f6662a35e0f0371ac234f9e9371',
            isNativeToken: false,
            name: 'Aave v3 wstETH',
            networkName: 'Ethereum',
            networkSymbol: 'eth',
            symbol: 'awsteth',
        });
    });
});
