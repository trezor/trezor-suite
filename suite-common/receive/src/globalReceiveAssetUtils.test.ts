import { type RankedTokenStructure } from '@suite-common/token-definitions';
import {
    type TradeableAssetBalance,
    type TradingAssetOption,
    getCryptoId,
} from '@suite-common/trading';
import { asNetworkSymbol, getMainnets } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber, getIndexOrThrow } from '@trezor/utils';

import {
    buildGlobalReceiveAssetOptions,
    buildGlobalReceiveAssetSearchIndex,
    getGlobalReceiveAssetDescriptionValues,
    getGlobalReceiveAssetSections,
} from './globalReceiveAssetUtils';

// Assets are keyed by the trade API's id type; read it off the option rather than importing invity.
type CryptoId = TradingAssetOption['id'];

type CreateAssetParams = {
    id: string;
    contractAddress?: string;
    isNativeToken?: boolean;
    networkName?: string;
    networkSymbol: 'btc' | 'eth' | 'arb';
};

const createAsset = ({
    id,
    contractAddress,
    isNativeToken = false,
    networkName,
    networkSymbol,
}: CreateAssetParams): TradingAssetOption =>
    ({
        id: id as CryptoId,
        contractAddress,
        isNativeToken,
        networkSymbol,
        networkName: networkName ?? networkSymbol,
    }) as TradingAssetOption;

const createBalance = (fiatAmount: string | null): TradeableAssetBalance => ({
    cryptoAmount: '1',
    fiatAmount: fiatAmount === null ? null : asBaseCurrencyAmount(new BigNumber(fiatAmount)),
});

const bitcoin = createAsset({
    id: 'bitcoin',
    isNativeToken: true,
    networkName: 'Bitcoin',
    networkSymbol: 'btc',
});
const ethereum = createAsset({
    id: 'ethereum',
    isNativeToken: true,
    networkName: 'Ethereum',
    networkSymbol: 'eth',
});
const ethereumUSDC = createAsset({
    id: 'ethereum--usdc',
    contractAddress: '0x-usdc',
    networkName: 'Ethereum',
    networkSymbol: 'eth',
});
const arbitrumUSDC = createAsset({
    id: 'arbitrum--usdc',
    contractAddress: '0x-arb-usdc',
    networkName: 'Arbitrum One',
    networkSymbol: 'arb',
});
const arbitrumEthereum = createAsset({
    id: 'arbitrum',
    isNativeToken: true,
    networkName: 'Arbitrum One',
    networkSymbol: 'arb',
});
const bridgedEthereum = createAsset({
    id: 'arbitrum--bridged-ethereum',
    contractAddress: '0x-bridged-eth',
    networkName: 'Arbitrum One',
    networkSymbol: 'arb',
});

const searchDefinitions: RankedTokenStructure = (
    [
        ['ethereum', '0x-zeta-usdc', 'Zeta USD Coin', 'usdc'],
        ['ethereum', '0x-usdc', 'USD Coin', 'usdc'],
        ['arbitrum-one', '0x-arb-usdc', 'USD Coin', 'usdc'],
        ['arbitrum-one', '0x-bridged-eth', 'Alpha Bridged Ethereum', 'eth'],
    ] as const
).map(([assetPlatformId, address, name, symbol]) => ({
    assetPlatformId,
    address,
    name,
    symbol,
    marketCap: 0,
}));

const getSections = (
    params: Omit<Parameters<typeof getGlobalReceiveAssetSections>[0], 'searchIndex'>,
) =>
    getGlobalReceiveAssetSections({
        ...params,
        searchIndex: buildGlobalReceiveAssetSearchIndex(params.assets, searchDefinitions),
    });

describe(getGlobalReceiveAssetDescriptionValues.name, () => {
    it('omits the network for a native asset', () => {
        expect(getGlobalReceiveAssetDescriptionValues(bitcoin)).toEqual({});
    });

    it('includes the network for a token', () => {
        expect(getGlobalReceiveAssetDescriptionValues(ethereumUSDC)).toEqual({
            networkName: 'Ethereum',
        });
    });
});

describe(getGlobalReceiveAssetSections.name, () => {
    it('includes previously used zero-balance assets after funded assets in My assets', () => {
        const balances = new Map([[ethereum.id, createBalance('20')]]);
        const result = getSections({
            assets: [bitcoin, ethereum, ethereumUSDC, arbitrumUSDC],
            balances,
            assetIdsWithHistory: new Set([bitcoin.id, arbitrumUSDC.id]),
            search: '',
            networkSymbols: [],
        });

        expect(result.myAssets.map(({ asset }) => asset.id)).toEqual([
            ethereum.id,
            bitcoin.id,
            arbitrumUSDC.id,
        ]);
        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([ethereumUSDC.id]);
        const zeroBalance: TradeableAssetBalance = {
            cryptoAmount: '0',
            fiatAmount: asBaseCurrencyAmount(new BigNumber(0)),
        };
        expect(result.myAssets.map(({ balance }) => balance)).toEqual([
            balances.get(ethereum.id),
            zeroBalance,
            zeroBalance,
        ]);
        expect(result.otherAssets[0]?.balance).toBeUndefined();
        expect(balances.size).toBe(1);
    });

    it('applies search and network filters to zero-balance assets with history', () => {
        const result = getSections({
            assets: [bitcoin, ethereum, ethereumUSDC, arbitrumUSDC],
            balances: new Map(),
            assetIdsWithHistory: new Set([bitcoin.id, ethereumUSDC.id, arbitrumUSDC.id]),
            search: 'usdc',
            networkSymbols: [asNetworkSymbol('arb')],
        });

        expect(result.myAssets.map(({ asset }) => asset.id)).toEqual([arbitrumUSDC.id]);
        expect(result.otherAssets).toEqual([]);
    });

    it('sorts held assets by fiat value, keeps stable ties, and places missing fiat last', () => {
        const balances = new Map<CryptoId, TradeableAssetBalance>([
            [bitcoin.id, createBalance('10')],
            [ethereum.id, createBalance('20')],
            [ethereumUSDC.id, createBalance('20')],
            [arbitrumUSDC.id, createBalance(null)],
        ]);

        const result = getSections({
            assets: [bitcoin, ethereum, ethereumUSDC, arbitrumUSDC],
            balances,
            search: '',
            networkSymbols: [],
        });

        expect(result.myAssets.map(({ asset }) => asset.id)).toEqual([
            ethereum.id,
            ethereumUSDC.id,
            bitcoin.id,
            arbitrumUSDC.id,
        ]);
        expect(result.myAssets.map(({ balance }) => balance)).toEqual([
            balances.get(ethereum.id),
            balances.get(ethereumUSDC.id),
            balances.get(bitcoin.id),
            balances.get(arbitrumUSDC.id),
        ]);
        expect(result.otherAssets).toEqual([]);
    });

    it('puts unheld native coins first without pinning featured tokens', () => {
        const balances = new Map<CryptoId, TradeableAssetBalance>([
            [ethereum.id, createBalance('20')],
        ]);

        const result = getSections({
            assets: [arbitrumUSDC, ethereumUSDC, bitcoin, ethereum],
            balances,
            search: '',
            networkSymbols: [],
        });

        expect(result.myAssets.map(({ asset }) => asset.id)).toEqual([ethereum.id]);
        expect(result.myAssets[0]?.balance).toBe(balances.get(ethereum.id));
        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([
            bitcoin.id,
            arbitrumUSDC.id,
            ethereumUSDC.id,
        ]);
        expect(result.otherAssets.map(({ balance }) => balance)).toEqual([
            undefined,
            undefined,
            undefined,
        ]);
    });

    it('searches multichain assets and native coins by their network', () => {
        const result = getSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum],
            balances: new Map(),
            search: 'usdc',
            networkSymbols: [],
        });

        expect(result.myAssets).toEqual([]);
        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([
            arbitrumUSDC.id,
            ethereumUSDC.id,
        ]);

        const networkResult = getSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum, arbitrumEthereum],
            balances: new Map(),
            search: 'arbitrum',
            networkSymbols: [],
        });

        expect(networkResult.otherAssets.map(({ asset }) => asset.id)).toEqual([
            arbitrumEthereum.id,
            arbitrumUSDC.id,
        ]);
    });

    it('puts a native asset before equally relevant token search results', () => {
        const result = getSections({
            assets: [bridgedEthereum, ethereum],
            balances: new Map(),
            search: 'eth',
            networkSymbols: [],
        });

        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([
            ethereum.id,
            bridgedEthereum.id,
        ]);
    });

    it('puts the native asset first when filtering to a network', () => {
        const result = getSections({
            assets: [arbitrumUSDC, arbitrumEthereum],
            balances: new Map(),
            search: '',
            networkSymbols: [asNetworkSymbol('arb')],
        });

        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([
            arbitrumEthereum.id,
            arbitrumUSDC.id,
        ]);
    });

    it('combines search and network filtering without reordering', () => {
        const result = getSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum],
            balances: new Map(),
            search: 'usd coin',
            networkSymbols: [asNetworkSymbol('eth')],
        });

        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([ethereumUSDC.id]);
    });

    it('preserves catalogue order in search results instead of ranking matches alphabetically', () => {
        const highestRanked = createAsset({
            id: 'ethereum--highest',
            contractAddress: '0x-zeta-usdc',
            networkSymbol: 'eth',
        });
        const result = getSections({
            assets: [highestRanked, ethereumUSDC, arbitrumUSDC],
            balances: new Map(),
            search: 'usd coin',
            networkSymbols: [],
        });

        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([
            highestRanked.id,
            ethereumUSDC.id,
            arbitrumUSDC.id,
        ]);
    });

    it('keeps a held token before an unheld native asset in a network search', () => {
        const result = getSections({
            assets: [arbitrumEthereum, arbitrumUSDC],
            balances: new Map([[arbitrumUSDC.id, createBalance('10')]]),
            search: 'arbitrum',
            networkSymbols: [asNetworkSymbol('arb')],
        });

        expect(result.myAssets.map(({ asset }) => asset.id)).toEqual([arbitrumUSDC.id]);
        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([arbitrumEthereum.id]);
    });

    it('limits unheld assets while keeping held and previously used assets', () => {
        const balances = new Map<CryptoId, TradeableAssetBalance>([
            [arbitrumUSDC.id, createBalance('10')],
        ]);

        const result = getSections({
            assets: [bitcoin, ethereum, arbitrumEthereum, arbitrumUSDC],
            balances,
            assetIdsWithHistory: new Set([ethereum.id]),
            search: '',
            networkSymbols: [],
            otherAssetsLimit: 1,
        });

        expect(result.myAssets.map(({ asset }) => asset.id)).toEqual([
            arbitrumUSDC.id,
            ethereum.id,
        ]);
        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([bitcoin.id]);
        expect(result.hasMoreOtherAssets).toBe(true);
    });

    it('does not report more assets when every matching asset fits under the limit', () => {
        const result = getSections({
            assets: [bitcoin, ethereum, arbitrumEthereum],
            balances: new Map(),
            assetIdsWithHistory: new Set([ethereum.id]),
            search: '',
            networkSymbols: [],
            otherAssetsLimit: 2,
        });

        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([
            bitcoin.id,
            arbitrumEthereum.id,
        ]);
        expect(result.hasMoreOtherAssets).toBe(false);
    });

    it.each(['USD COIN', 'usdc', 'Ethereum', 'eth', '0X-USDC'])('searches by %s', search => {
        const result = getSections({
            assets: [ethereumUSDC],
            balances: new Map(),
            search,
            networkSymbols: [],
        });

        expect(result.otherAssets.map(({ asset }) => asset.id)).toEqual([ethereumUSDC.id]);
    });
});

const rankedDefinitions: RankedTokenStructure = [
    {
        assetPlatformId: 'polygon-pos',
        address: '0xAbCd',
        symbol: 'usdc',
        name: 'USD Coin',
        marketCap: 100,
    },
    {
        assetPlatformId: 'binance-smart-chain',
        address: '0xDcBa',
        symbol: 'usdt',
        name: 'Tether',
        marketCap: 90,
    },
    {
        assetPlatformId: 'arbitrum-one',
        address: '0xAbCd',
        symbol: 'usdc',
        name: 'USD Coin',
        marketCap: 80,
    },
    {
        assetPlatformId: 'solana',
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'wsol',
        name: 'Wrapped SOL',
        marketCap: 70,
    },
    {
        assetPlatformId: 'stellar',
        address: 'USDC-GA5ZSEJYB37JRC5AVSPW4Y5V4E4IJKMSKZP4B2M5ES7KX7RKREAC7BHJ',
        symbol: 'usdc',
        name: 'USD Coin',
        marketCap: 0,
    },
];

describe(buildGlobalReceiveAssetOptions.name, () => {
    const polygonToken = getIndexOrThrow(rankedDefinitions, 0);
    const wrappedSolToken = getIndexOrThrow(rankedDefinitions, 3);
    const stellarToken = getIndexOrThrow(rankedDefinitions, 4);

    it('includes all eligible native mainnets even with no token definitions', () => {
        const networks = getMainnets();
        const assets = buildGlobalReceiveAssetOptions({ networks, definitions: [] });

        expect(assets.map(asset => asset.networkSymbol)).toEqual(
            networks.map(network => network.symbol),
        );
        expect(assets.every(asset => asset.isNativeToken)).toBe(true);
        expect(assets.map(asset => asset.id)).toEqual(
            networks.map(network => getCryptoId(network.symbol)),
        );
    });

    it('maps platforms using their CoinGecko ID and preserves token rank', () => {
        const assets = buildGlobalReceiveAssetOptions({
            networks: getMainnets(),
            definitions: rankedDefinitions,
        });
        const tokens = assets.filter(asset => !asset.isNativeToken);

        expect(tokens.map(asset => asset.networkSymbol)).toEqual([
            'pol',
            'bsc',
            'arb',
            'sol',
            'xlm',
        ]);
        expect(tokens.map(asset => asset.id)).toEqual([
            'polygon-pos--0xabcd',
            'binance-smart-chain--0xdcba',
            'arbitrum-one--0xabcd',
            `solana--${wrappedSolToken.address}`,
            `stellar--${stellarToken.address}`,
        ]);
        expect(tokens[3]).toMatchObject({
            isNativeToken: false,
            contractAddress: wrappedSolToken.address,
        });
    });

    it('excludes unsupported networks locally and ignores unknown catalogue platforms', () => {
        const networks = getMainnets().filter(network => network.symbol === 'sol');
        const assets = buildGlobalReceiveAssetOptions({
            networks,
            definitions: [...rankedDefinitions, { ...polygonToken, assetPlatformId: 'unknown' }],
        });

        expect(assets.map(asset => asset.id)).toEqual([
            'solana',
            `solana--${wrappedSolToken.address}`,
        ]);
    });

    it('keeps the highest-ranked entry when contracts normalize to the same ID', () => {
        const definitions = [
            polygonToken,
            { ...polygonToken, address: '0xabcd', name: 'Duplicate', marketCap: 0 },
        ];
        const assets = buildGlobalReceiveAssetOptions({ networks: getMainnets(), definitions });
        const tokens = assets.filter(asset => !asset.isNativeToken);
        const searchIndex = buildGlobalReceiveAssetSearchIndex(assets, definitions);

        expect(tokens.map(asset => searchIndex.get(asset)?.name)).toEqual(['usd coin']);
    });

    it('uses token IDs compatible with the local balance lookup', () => {
        const assets = buildGlobalReceiveAssetOptions({
            networks: getMainnets(),
            definitions: rankedDefinitions,
        });
        const balance = createBalance('25');
        const result = getSections({
            assets,
            balances: new Map([
                [getCryptoId(asNetworkSymbol('sol'), wrappedSolToken.address), balance],
            ]),
            search: '',
            networkSymbols: [],
        });

        expect(result.myAssets).toEqual([
            {
                asset: expect.objectContaining({ contractAddress: wrappedSolToken.address }),
                balance,
            },
        ]);
    });
});
