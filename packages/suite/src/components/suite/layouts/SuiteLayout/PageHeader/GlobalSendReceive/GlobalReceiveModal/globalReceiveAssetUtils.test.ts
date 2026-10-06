import { type CryptoId } from 'invity-api';

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
    getGlobalReceiveAssetDescriptionValues,
    getGlobalReceiveAssetSections,
} from './globalReceiveAssetUtils';

type CreateAssetParams = {
    id: string;
    name: string;
    displaySymbol: string;
    contractAddress?: string;
    isNativeToken?: boolean;
    networkName?: string;
    networkSymbol: 'btc' | 'eth' | 'arb';
};

const createAsset = ({
    id,
    name,
    displaySymbol,
    contractAddress,
    isNativeToken = false,
    networkName,
    networkSymbol,
}: CreateAssetParams): TradingAssetOption =>
    ({
        id: id as CryptoId,
        name,
        displaySymbolName: name,
        displaySymbol,
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
    name: 'Bitcoin',
    displaySymbol: 'BTC',
    isNativeToken: true,
    networkName: 'Bitcoin',
    networkSymbol: 'btc',
});
const ethereum = createAsset({
    id: 'ethereum',
    name: 'Ethereum',
    displaySymbol: 'ETH',
    isNativeToken: true,
    networkName: 'Ethereum',
    networkSymbol: 'eth',
});
const ethereumUSDC = createAsset({
    id: 'ethereum--usdc',
    name: 'USD Coin',
    displaySymbol: 'USDC',
    contractAddress: '0x-usdc',
    networkName: 'Ethereum',
    networkSymbol: 'eth',
});
const arbitrumUSDC = createAsset({
    id: 'arbitrum--usdc',
    name: 'USD Coin',
    displaySymbol: 'USDC',
    contractAddress: '0x-arb-usdc',
    networkName: 'Arbitrum One',
    networkSymbol: 'arb',
});
const arbitrumEthereum = createAsset({
    id: 'arbitrum',
    name: 'Arbitrum One Ethereum',
    displaySymbol: 'ETH',
    isNativeToken: true,
    networkName: 'Arbitrum One',
    networkSymbol: 'arb',
});
const bridgedEthereum = createAsset({
    id: 'arbitrum--bridged-ethereum',
    name: 'Alpha Bridged Ethereum',
    displaySymbol: 'ETH',
    contractAddress: '0x-bridged-eth',
    networkName: 'Arbitrum One',
    networkSymbol: 'arb',
});

describe(getGlobalReceiveAssetDescriptionValues.name, () => {
    it('omits the network for a native asset', () => {
        expect(getGlobalReceiveAssetDescriptionValues(bitcoin)).toEqual({
            assetName: 'Bitcoin',
        });
    });

    it('includes the network for a token', () => {
        expect(getGlobalReceiveAssetDescriptionValues(ethereumUSDC)).toEqual({
            assetName: 'USD Coin',
            networkName: 'Ethereum',
        });
    });
});

describe(getGlobalReceiveAssetSections.name, () => {
    it('sorts held assets by fiat value, keeps stable ties, and places missing fiat last', () => {
        const balances = new Map<CryptoId, TradeableAssetBalance>([
            [bitcoin.id, createBalance('10')],
            [ethereum.id, createBalance('20')],
            [ethereumUSDC.id, createBalance('20')],
            [arbitrumUSDC.id, createBalance(null)],
        ]);

        const result = getGlobalReceiveAssetSections({
            assets: [bitcoin, ethereum, ethereumUSDC, arbitrumUSDC],
            balances,
            search: '',
            networkSymbol: undefined,
        });

        expect(result.assetsWithBalance.map(({ asset }) => asset.id)).toEqual([
            ethereum.id,
            ethereumUSDC.id,
            bitcoin.id,
            arbitrumUSDC.id,
        ]);
        expect(result.assetsWithBalance.map(({ balance }) => balance)).toEqual([
            balances.get(ethereum.id),
            balances.get(ethereumUSDC.id),
            balances.get(bitcoin.id),
            balances.get(arbitrumUSDC.id),
        ]);
        expect(result.assetsWithoutBalance).toEqual([]);
    });

    it('puts unheld native coins first without pinning featured tokens', () => {
        const balances = new Map<CryptoId, TradeableAssetBalance>([
            [ethereum.id, createBalance('20')],
        ]);

        const result = getGlobalReceiveAssetSections({
            assets: [arbitrumUSDC, ethereumUSDC, bitcoin, ethereum],
            balances,
            search: '',
            networkSymbol: undefined,
        });

        expect(result.assetsWithBalance.map(({ asset }) => asset.id)).toEqual([ethereum.id]);
        expect(result.assetsWithBalance[0]?.balance).toBe(balances.get(ethereum.id));
        expect(result.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([
            bitcoin.id,
            arbitrumUSDC.id,
            ethereumUSDC.id,
        ]);
        expect(result.assetsWithoutBalance.map(({ balance }) => balance)).toEqual([
            undefined,
            undefined,
            undefined,
        ]);
    });

    it('searches multichain assets and native coins by their network', () => {
        const result = getGlobalReceiveAssetSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum],
            balances: new Map(),
            search: 'usdc',
            networkSymbol: undefined,
        });

        expect(result.assetsWithBalance).toEqual([]);
        expect(result.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([
            arbitrumUSDC.id,
            ethereumUSDC.id,
        ]);

        const networkResult = getGlobalReceiveAssetSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum, arbitrumEthereum],
            balances: new Map(),
            search: 'arbitrum',
            networkSymbol: undefined,
        });

        expect(networkResult.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([
            arbitrumEthereum.id,
            arbitrumUSDC.id,
        ]);
    });

    it('puts a native asset before equally relevant token search results', () => {
        const result = getGlobalReceiveAssetSections({
            assets: [bridgedEthereum, ethereum],
            balances: new Map(),
            search: 'eth',
            networkSymbol: undefined,
        });

        expect(result.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([
            ethereum.id,
            bridgedEthereum.id,
        ]);
    });

    it('puts the native asset first when filtering to a network', () => {
        const result = getGlobalReceiveAssetSections({
            assets: [arbitrumUSDC, arbitrumEthereum],
            balances: new Map(),
            search: '',
            networkSymbol: asNetworkSymbol('arb'),
        });

        expect(result.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([
            arbitrumEthereum.id,
            arbitrumUSDC.id,
        ]);
    });

    it('combines search and network filtering without reordering', () => {
        const result = getGlobalReceiveAssetSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum],
            balances: new Map(),
            search: 'usd coin',
            networkSymbol: asNetworkSymbol('eth'),
        });

        expect(result.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([ethereumUSDC.id]);
    });

    it('preserves catalogue order in search results instead of ranking matches alphabetically', () => {
        const highestRanked = createAsset({
            id: 'ethereum--highest',
            name: 'Zeta USD Coin',
            displaySymbol: 'USDC',
            networkSymbol: 'eth',
        });
        const result = getGlobalReceiveAssetSections({
            assets: [highestRanked, ethereumUSDC, arbitrumUSDC],
            balances: new Map(),
            search: 'usd coin',
            networkSymbol: undefined,
        });

        expect(result.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([
            highestRanked.id,
            ethereumUSDC.id,
            arbitrumUSDC.id,
        ]);
    });

    it('keeps a held token before an unheld native asset in a network search', () => {
        const result = getGlobalReceiveAssetSections({
            assets: [arbitrumEthereum, arbitrumUSDC],
            balances: new Map([[arbitrumUSDC.id, createBalance('10')]]),
            search: 'arbitrum',
            networkSymbol: asNetworkSymbol('arb'),
        });

        expect(result.assetsWithBalance.map(({ asset }) => asset.id)).toEqual([arbitrumUSDC.id]);
        expect(result.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([
            arbitrumEthereum.id,
        ]);
    });

    it.each(['USD COIN', 'usdc', 'Ethereum', 'eth', '0X-USDC'])('searches by %s', search => {
        const result = getGlobalReceiveAssetSections({
            assets: [ethereumUSDC],
            balances: new Map(),
            search,
            networkSymbol: undefined,
        });

        expect(result.assetsWithoutBalance.map(({ asset }) => asset.id)).toEqual([ethereumUSDC.id]);
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

    it('maps platforms using their CoinGecko ID, normalizes display symbols, and preserves token rank', () => {
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
        expect(tokens.map(asset => asset.displaySymbol)).toEqual([
            'USDC',
            'USDT',
            'USDC',
            'WSOL',
            'USDC',
        ]);
        expect(tokens[3]).toMatchObject({
            name: 'Wrapped SOL',
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
        const assets = buildGlobalReceiveAssetOptions({
            networks: getMainnets(),
            definitions: [
                polygonToken,
                { ...polygonToken, address: '0xabcd', name: 'Duplicate', marketCap: 0 },
            ],
        });

        expect(assets.filter(asset => !asset.isNativeToken).map(asset => asset.name)).toEqual([
            'USD Coin',
        ]);
    });

    it('uses token IDs compatible with the local balance lookup', () => {
        const assets = buildGlobalReceiveAssetOptions({
            networks: getMainnets(),
            definitions: rankedDefinitions,
        });
        const balance = createBalance('25');
        const result = getGlobalReceiveAssetSections({
            assets,
            balances: new Map([
                [getCryptoId(asNetworkSymbol('sol'), wrappedSolToken.address), balance],
            ]),
            search: '',
            networkSymbol: undefined,
        });

        expect(result.assetsWithBalance).toEqual([
            { asset: expect.objectContaining({ name: 'Wrapped SOL' }), balance },
        ]);
    });
});
