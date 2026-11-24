import { createAssetId, parseAssetId } from '@suite-common/asset-types';
import { type RankedTokenStructure } from '@suite-common/token-definitions';
import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol, getMainnets, getNetwork } from '@suite-common/wallet-config';
import { type AssetBalance, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import {
    buildGlobalReceiveAssetCatalog,
    getGlobalReceiveAssetSections,
} from './globalReceiveAssetUtils';

const eth = asNetworkSymbol('eth');
const arb = asNetworkSymbol('arb');
const bitcoin = createAssetId({ networkSymbol: asNetworkSymbol('btc') });
const ethereum = createAssetId({ networkSymbol: eth });
const arbitrum = createAssetId({ networkSymbol: arb });
const contract = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const ethereumUSDC = createAssetId({ networkSymbol: eth, contractAddress: contract });
const arbitrumUSDC = createAssetId({ networkSymbol: arb, contractAddress: contract });
const usdCoin = {
    assetPlatformId: 'ethereum',
    address: contract,
    symbol: 'usdc',
    name: 'USD Coin',
    marketCap: 100,
};
const definitions: RankedTokenStructure = [
    usdCoin,
    { ...usdCoin, assetPlatformId: 'arbitrum-one', marketCap: 90 },
];
const createBalance = (fiatAmount: string | null): AssetBalance => ({
    cryptoAmount: '1',
    fiatAmount: fiatAmount === null ? null : asBaseCurrencyAmount(new BigNumber(fiatAmount)),
});
const createCatalog = () =>
    buildGlobalReceiveAssetCatalog({
        networks: ['btc', 'eth', 'arb'].map(symbol => getNetwork(asNetworkSymbol(symbol))),
        definitions,
    });

describe('receive catalogue', () => {
    it('builds native identities independently of trading IDs', () => {
        const networks = getMainnets();
        const result = buildGlobalReceiveAssetCatalog({ networks, definitions: [] });
        expect(result.assetIds).toEqual(
            networks.map(network => createAssetId({ networkSymbol: network.symbol })),
        );
        expect(result.assetIds.every(id => parseAssetId(id).contractAddress === undefined)).toBe(
            true,
        );
    });

    it('preserves token rank and the first normalized duplicate', () => {
        const result = buildGlobalReceiveAssetCatalog({
            networks: [getNetwork('eth'), getNetwork('arb')],
            definitions: [
                ...definitions,
                { ...usdCoin, address: contract.toLowerCase(), name: 'Duplicate' },
            ],
        });
        expect(result.assetIds).toEqual([ethereum, arbitrum, ethereumUSDC, arbitrumUSDC]);
        expect(result.searchIndex.get(ethereumUSDC)).toContainEqual('usd coin');
        expect(result.searchIndex.get(ethereumUSDC)).not.toContainEqual('duplicate');
    });

    it('filters unsupported platforms locally and preserves case-sensitive mints', () => {
        const mint = 'So11111111111111111111111111111111111111112';
        const result = buildGlobalReceiveAssetCatalog({
            networks: [getNetwork('sol')],
            definitions: [
                ...definitions,
                {
                    assetPlatformId: 'solana',
                    address: mint,
                    symbol: 'wsol',
                    name: 'Wrapped SOL',
                    marketCap: 80,
                },
                {
                    assetPlatformId: 'solana',
                    address: mint.toLowerCase(),
                    symbol: 'other',
                    name: 'Other mint',
                    marketCap: 70,
                },
            ],
        });
        expect(result.assetIds.map(id => parseAssetId(id).contractAddress)).toEqual([
            undefined,
            mint,
            mint.toLowerCase(),
        ]);
    });
});

describe('receive asset sections', () => {
    it('preserves market-cap order when matching token names would sort differently', () => {
        const rankedCatalog = buildGlobalReceiveAssetCatalog({
            networks: [getNetwork('eth'), getNetwork('arb')],
            definitions: [{ ...usdCoin, name: 'Zeta USD Coin' }, ...definitions.slice(1)],
        });
        const result = getGlobalReceiveAssetSections({
            catalog: rankedCatalog,
            balances: new Map(),
            search: 'usd coin',
            networkSymbols: [],
        });

        expect(result.otherAssets.map(item => item.assetId)).toEqual([ethereumUSDC, arbitrumUSDC]);
    });

    it('puts matching native assets ahead of unheld tokens in search results', () => {
        const result = getGlobalReceiveAssetSections({
            catalog: createCatalog(),
            balances: new Map(),
            search: 'ethereum',
            networkSymbols: [],
        });

        expect(result.otherAssets.map(item => item.assetId)).toEqual([
            ethereum,
            arbitrum,
            ethereumUSDC,
        ]);
    });

    it('filters previously used zero-balance assets by network and search', () => {
        const result = getGlobalReceiveAssetSections({
            catalog: createCatalog(),
            balances: new Map(),
            assetIdsWithHistory: new Set([bitcoin, ethereumUSDC, arbitrumUSDC]),
            search: 'usdc',
            networkSymbols: [arb],
        });

        expect(result.myAssets.map(item => item.assetId)).toEqual([arbitrumUSDC]);
        expect(result.otherAssets).toEqual([]);
    });

    it('sorts funded assets by fiat, preserves ties, puts missing prices last, then adds used zero balances', () => {
        const balances = new Map([
            [ethereum, createBalance('20')],
            [ethereumUSDC, createBalance('20')],
            [bitcoin, createBalance('10')],
            [arbitrumUSDC, createBalance(null)],
        ]);
        const result = getGlobalReceiveAssetSections({
            catalog: createCatalog(),
            balances,
            assetIdsWithHistory: new Set([arbitrum]),
            search: '',
            networkSymbols: [],
        });
        expect(result.myAssets.map(item => item.assetId)).toEqual([
            ethereum,
            ethereumUSDC,
            bitcoin,
            arbitrumUSDC,
            arbitrum,
        ]);
        expect(result.myAssets.at(-1)?.balance?.cryptoAmount).toBe('0');
        expect(result.myAssets.at(-1)?.balance?.fiatAmount?.isZero()).toBe(true);
        expect(result.otherAssets).toEqual([]);
        expect(balances.size).toBe(4);
    });

    it('places native assets first and keeps token rank within the unheld section', () => {
        const result = getGlobalReceiveAssetSections({
            catalog: {
                ...createCatalog(),
                assetIds: [arbitrumUSDC, ethereumUSDC, bitcoin, ethereum],
            },
            balances: new Map(),
            search: '',
            networkSymbols: [],
        });
        expect(result.otherAssets.map(item => item.assetId)).toEqual([
            bitcoin,
            ethereum,
            arbitrumUSDC,
            ethereumUSDC,
        ]);
        expect(result.otherAssets.every(item => item.balance === undefined)).toBe(true);
    });

    it.each(['USD COIN', 'usdc', 'Ethereum', 'eth', contract.toUpperCase()])(
        'searches by %s with network filtering',
        search => {
            const result = getGlobalReceiveAssetSections({
                catalog: createCatalog(),
                balances: new Map(),
                search,
                networkSymbols: [eth],
            });
            expect(result.otherAssets.map(item => item.assetId)).toContainEqual(ethereumUSDC);
            expect(result.otherAssets.map(item => item.assetId)).not.toContainEqual(arbitrumUSDC);
        },
    );

    it('applies filters to used assets and keeps held tokens before unheld native assets', () => {
        const result = getGlobalReceiveAssetSections({
            catalog: createCatalog(),
            balances: new Map([[arbitrumUSDC, createBalance('10')]]),
            assetIdsWithHistory: new Set([ethereumUSDC]),
            search: 'arbitrum',
            networkSymbols: [arb],
        });
        expect(result.myAssets.map(item => item.assetId)).toEqual([arbitrumUSDC]);
        expect(result.otherAssets.map(item => item.assetId)).toEqual([arbitrum]);
    });

    it('limits only unheld assets while preserving funded and previously used assets', () => {
        const result = getGlobalReceiveAssetSections({
            catalog: createCatalog(),
            balances: new Map([[arbitrumUSDC, createBalance('10')]]),
            assetIdsWithHistory: new Set([ethereum]),
            search: '',
            networkSymbols: [],
            otherAssetsLimit: 1,
        });
        expect(result.myAssets.map(item => item.assetId)).toEqual([arbitrumUSDC, ethereum]);
        expect(result.otherAssets.map(item => item.assetId)).toEqual([bitcoin]);
        expect(result.hasMoreOtherAssets).toBe(true);
    });

    it('does not report more results when every match fits, or no asset matches', () => {
        const catalog = createCatalog();
        const result = getGlobalReceiveAssetSections({
            catalog,
            balances: new Map(),
            search: 'usdc',
            networkSymbols: [],
            otherAssetsLimit: 2,
        });
        expect(result.otherAssets.map(item => item.assetId)).toEqual([ethereumUSDC, arbitrumUSDC]);
        expect(result.hasMoreOtherAssets).toBe(false);
        expect(
            getGlobalReceiveAssetSections({
                catalog,
                balances: new Map(),
                search: 'missing',
                networkSymbols: [],
            }).otherAssets,
        ).toEqual([]);
    });
});
