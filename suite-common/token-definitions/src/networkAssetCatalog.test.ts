import { getMainnets, getNetwork } from '@suite-common/wallet-config';

import { buildNetworkAssetCatalog } from './networkAssetCatalog';
import { type RankedTokenStructure } from './tokenDefinitionsTypes';

const ethereum = getNetwork('eth');
const solana = getNetwork('sol');
const definitions: RankedTokenStructure = [
    {
        assetPlatformId: 'ethereum',
        address: '0xABC',
        symbol: 'usdc',
        name: 'USD Coin',
        marketCap: 3,
    },
    {
        assetPlatformId: 'solana',
        address: 'Mint',
        symbol: 'soltoken',
        name: 'Sol Token',
        marketCap: 2,
    },
    {
        assetPlatformId: 'ethereum',
        address: '0xDEF',
        symbol: 'link',
        name: 'Chainlink',
        marketCap: 1,
    },
];

describe('buildNetworkAssetCatalog', () => {
    it('puts native assets first and preserves the global token ranking across networks', () => {
        const assets = buildNetworkAssetCatalog({ networks: [ethereum, solana], definitions });

        expect(assets).toEqual([
            { networkSymbol: ethereum.symbol, symbol: 'ETH', name: ethereum.name },
            { networkSymbol: solana.symbol, symbol: 'SOL', name: solana.name },
            { networkSymbol: ethereum.symbol, symbol: 'USDC', name: 'USD Coin', contract: '0xABC' },
            {
                networkSymbol: solana.symbol,
                symbol: 'SOLTOKEN',
                name: 'Sol Token',
                contract: 'Mint',
            },
            {
                networkSymbol: ethereum.symbol,
                symbol: 'LINK',
                name: 'Chainlink',
                contract: '0xDEF',
            },
        ]);
    });

    it('keeps every mainnet native asset without catalogue data', () => {
        const networks = getMainnets();

        expect(buildNetworkAssetCatalog({ networks, definitions: [] })).toEqual(
            networks.map(network => ({
                networkSymbol: network.symbol,
                symbol: network.displaySymbol,
                name: network.name,
            })),
        );
    });

    it('excludes testnets, unknown platforms, and tokens on tokenless networks', () => {
        const bitcoin = getNetwork('btc');
        const testnet = getNetwork('tsep');
        const assets = buildNetworkAssetCatalog({
            networks: [bitcoin, testnet],
            definitions: [
                {
                    assetPlatformId: bitcoin.coingeckoId,
                    address: 'btc-token',
                    symbol: 'fake',
                    name: 'Fake',
                    marketCap: 3,
                },
                {
                    assetPlatformId: testnet.coingeckoId,
                    address: 'test-token',
                    symbol: 'test',
                    name: 'Test',
                    marketCap: 2,
                },
                ...definitions,
            ],
        });

        expect(assets).toEqual([
            { networkSymbol: bitcoin.symbol, symbol: 'BTC', name: bitcoin.name },
        ]);
    });

    it('keeps the first Ethereum contract and preserves its original spelling', () => {
        const assets = buildNetworkAssetCatalog({
            networks: [ethereum],
            definitions: [
                ...definitions,
                {
                    assetPlatformId: 'ethereum',
                    address: '0xabc',
                    symbol: 'usdc',
                    name: 'Duplicate',
                    marketCap: 0,
                },
            ],
        });

        expect(assets.map(asset => asset.name)).toEqual([ethereum.name, 'USD Coin', 'Chainlink']);
        expect(assets[1]?.contract).toBe('0xABC');
    });

    it('preserves case-sensitive contracts while removing exact duplicates', () => {
        const assets = buildNetworkAssetCatalog({
            networks: [solana],
            definitions: [
                ...definitions,
                {
                    assetPlatformId: 'solana',
                    address: 'mint',
                    symbol: 'other',
                    name: 'Other',
                    marketCap: 1,
                },
                {
                    assetPlatformId: 'solana',
                    address: 'Mint',
                    symbol: 'duplicate',
                    name: 'Duplicate',
                    marketCap: 0,
                },
            ],
        });

        expect(assets.map(asset => asset.contract)).toEqual([undefined, 'Mint', 'mint']);
    });

    it('keeps distinct Cardano assets issued under the same policy', () => {
        const cardano = getNetwork('ada');
        const policyId = 'a'.repeat(56);
        const assets = buildNetworkAssetCatalog({
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

        expect(assets.map(asset => asset.name)).toEqual([cardano.name, 'First', 'Second']);
    });

    it('keeps the full catalogue rather than limiting it to representative icons', () => {
        const tokens: RankedTokenStructure = Array.from({ length: 6 }, (_, index) => ({
            assetPlatformId: 'ethereum',
            address: `0x${index}`,
            symbol: `token${index}`,
            name: `Token ${index}`,
            marketCap: 6 - index,
        }));

        expect(
            buildNetworkAssetCatalog({ networks: [ethereum], definitions: tokens }),
        ).toHaveLength(7);
    });
});
