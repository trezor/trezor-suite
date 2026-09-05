import { type CryptoId } from 'invity-api';

import { type TradeableAssetBalance, type TradingAssetOption } from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import {
    getGlobalReceiveAssetDescriptionValues,
    getGlobalReceiveAssetSections,
} from './globalReceiveAssetUtils';

const createAsset = ({
    id,
    name,
    displaySymbol,
    contractAddress,
    isNativeToken = false,
    networkName,
    networkSymbol,
}: {
    id: string;
    name: string;
    displaySymbol: string;
    contractAddress?: string;
    isNativeToken?: boolean;
    networkName?: string;
    networkSymbol: 'btc' | 'eth' | 'arb';
}): TradingAssetOption =>
    ({
        id: id as CryptoId,
        name,
        displaySymbolName: name,
        displaySymbol,
        contractAddress,
        isNativeToken,
        networkSymbol,
        networkName: networkName ?? networkSymbol,
    }) as unknown as TradingAssetOption;

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
        expect(result.allAssets).toEqual([]);
    });

    it('uses the swap destination featured order before the incoming order', () => {
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
        expect(result.allAssets.map(({ asset }) => asset.id)).toEqual([
            bitcoin.id,
            arbitrumUSDC.id,
            ethereumUSDC.id,
        ]);
    });

    it('uses the shared trading search ranking for multichain assets', () => {
        const result = getGlobalReceiveAssetSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum],
            balances: new Map(),
            search: 'usdc',
            networkSymbol: undefined,
        });

        expect(result.assetsWithBalance).toEqual([]);
        expect(result.allAssets.map(({ asset }) => asset.id)).toEqual([
            arbitrumUSDC.id,
            ethereumUSDC.id,
        ]);

        const networkResult = getGlobalReceiveAssetSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum],
            balances: new Map(),
            search: 'arbitrum',
            networkSymbol: undefined,
        });

        expect(networkResult.allAssets.map(({ asset }) => asset.id)).toEqual([arbitrumUSDC.id]);
    });

    it('combines search and network filtering without reordering', () => {
        const result = getGlobalReceiveAssetSections({
            assets: [bitcoin, arbitrumUSDC, ethereumUSDC, ethereum],
            balances: new Map(),
            search: 'usd coin',
            networkSymbol: 'eth',
        });

        expect(result.allAssets.map(({ asset }) => asset.id)).toEqual([ethereumUSDC.id]);
    });
});
