import { getMainnets, getNetwork } from '@suite-common/wallet-config';

import {
    MAX_REPRESENTATIVE_ASSETS,
    buildNetworkRepresentativeAssets,
} from './networkRepresentativeAssets';
import { type RankedTokenStructure } from './tokenDefinitionsTypes';

const ethereum = getNetwork('eth');
const solana = getNetwork('sol');
const bitcoin = getNetwork('btc');
const definitions: RankedTokenStructure = [
    {
        assetPlatformId: 'ethereum',
        address: '0xABC',
        symbol: 'usdt',
        name: 'Tether',
        marketCap: 100,
    },
    {
        assetPlatformId: 'solana',
        address: 'CaseSensitiveMint',
        symbol: 'usdc',
        name: 'USDC',
        marketCap: 90,
    },
    {
        assetPlatformId: 'ethereum',
        address: '0xabc',
        symbol: 'usdt',
        name: 'Duplicate Tether',
        marketCap: 80,
    },
    { assetPlatformId: 'ethereum', address: '0x2', symbol: 'usdc', name: 'USDC', marketCap: 70 },
    {
        assetPlatformId: 'ethereum',
        address: '0x3',
        symbol: 'link',
        name: 'Chainlink',
        marketCap: 60,
    },
    {
        assetPlatformId: 'unsupported-platform',
        address: '0x4',
        symbol: 'other',
        name: 'Other',
        marketCap: 50,
    },
    { assetPlatformId: 'ethereum', address: '0x5', symbol: 'uni', name: 'Uniswap', marketCap: 40 },
    { assetPlatformId: 'ethereum', address: '0x6', symbol: 'extra', name: 'Extra', marketCap: 30 },
];

describe('buildNetworkRepresentativeAssets', () => {
    it('keeps the native coin first and selects the four largest distinct tokens on each network', () => {
        const result = buildNetworkRepresentativeAssets({
            networks: [ethereum, solana],
            definitions,
        });

        expect(result.get(ethereum.symbol)).toEqual([
            { symbol: 'ETH' },
            { symbol: 'USDT', contract: '0xABC' },
            { symbol: 'USDC', contract: '0x2' },
            { symbol: 'LINK', contract: '0x3' },
            { symbol: 'UNI', contract: '0x5' },
        ]);
        expect(result.get(ethereum.symbol)).toHaveLength(MAX_REPRESENTATIVE_ASSETS);
        expect(result.get(solana.symbol)).toEqual([
            { symbol: 'SOL' },
            { symbol: 'USDC', contract: 'CaseSensitiveMint' },
        ]);
        expect(result.size).toBe(2);
        expect(definitions).toHaveLength(8);
    });

    it('shows the configured native asset on every mainnet without definitions', () => {
        const networks = getMainnets();
        const result = buildNetworkRepresentativeAssets({ networks, definitions: [] });

        networks.forEach(network => {
            expect(result.get(network.symbol)).toEqual([{ symbol: network.displaySymbol }]);
        });
    });

    it('does not display tokens on tokenless networks or assets on testnets', () => {
        const result = buildNetworkRepresentativeAssets({
            networks: [bitcoin, getNetwork('tsep')],
            definitions: [
                {
                    assetPlatformId: bitcoin.coingeckoId,
                    address: '0x1',
                    symbol: 'fake',
                    name: 'Fake',
                    marketCap: 100,
                },
                ...definitions,
            ],
        });

        expect(result.get(bitcoin.symbol)).toEqual([{ symbol: 'BTC' }]);
        expect(result.size).toBe(1);
    });

    it('does not collapse case-sensitive Solana contracts', () => {
        const result = buildNetworkRepresentativeAssets({
            networks: [solana],
            definitions: [
                {
                    assetPlatformId: 'solana',
                    address: 'Mint',
                    symbol: 'one',
                    name: 'One',
                    marketCap: 2,
                },
                {
                    assetPlatformId: 'solana',
                    address: 'mint',
                    symbol: 'two',
                    name: 'Two',
                    marketCap: 1,
                },
            ],
        });

        expect(result.get(solana.symbol)).toEqual([
            { symbol: 'SOL' },
            { symbol: 'ONE', contract: 'Mint' },
            { symbol: 'TWO', contract: 'mint' },
        ]);
    });

    it('maps Stellar issuer contracts without changing them', () => {
        const stellar = getNetwork('xlm');
        const contract = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
        const result = buildNetworkRepresentativeAssets({
            networks: [stellar],
            definitions: [
                {
                    assetPlatformId: 'stellar',
                    address: contract,
                    symbol: 'usdc',
                    name: 'USDC',
                    marketCap: 1,
                },
            ],
        });

        expect(result.get(stellar.symbol)).toEqual([
            { symbol: 'XLM' },
            { symbol: 'USDC', contract },
        ]);
    });

    it('keeps distinct Cardano token contracts under the same policy', () => {
        const cardano = getNetwork('ada');
        const policyId = 'a'.repeat(56);
        const result = buildNetworkRepresentativeAssets({
            networks: [cardano],
            definitions: [
                {
                    assetPlatformId: cardano.coingeckoId,
                    address: `${policyId}01`,
                    symbol: 'one',
                    name: 'First',
                    marketCap: 2,
                },
                {
                    assetPlatformId: cardano.coingeckoId,
                    address: `${policyId}02`,
                    symbol: 'two',
                    name: 'Second',
                    marketCap: 1,
                },
            ],
        });

        expect(result.get(cardano.symbol)).toEqual([
            { symbol: 'ADA' },
            { symbol: 'ONE', contract: `${policyId}01` },
            { symbol: 'TWO', contract: `${policyId}02` },
        ]);
    });
});
