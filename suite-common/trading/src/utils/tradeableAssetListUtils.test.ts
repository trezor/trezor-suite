import { type CryptoId } from 'invity-api';

import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import {
    type TradeableAssetBalance,
    type TradeableAssetBalances,
} from './tradeableAssetBalanceUtils';
import {
    type TradeableAssetSearchFields,
    buildTradeableAssetSearchIndex,
    filterTradeableAssetsBySearch,
    orderTradeableAssetsByOwnership,
} from './tradeableAssetListUtils';

type TestAsset = {
    cryptoId: CryptoId;
    name: string;
    symbol: string;
    networkName: string;
    networkSymbol: string;
    contractAddress: string;
};

const createAsset = (asset: Partial<TestAsset> = {}): TestAsset => ({
    cryptoId: 'ethereum--0xtoken' as CryptoId,
    name: 'Token',
    symbol: 'TKN',
    networkName: 'Ethereum',
    networkSymbol: 'eth',
    contractAddress: '0xtoken',
    ...asset,
});

const getAssetCryptoId = (asset: TestAsset) => asset.cryptoId;
const getSearchFields = (asset: TestAsset): TradeableAssetSearchFields => asset;

const bitcoin = createAsset({ cryptoId: 'bitcoin' as CryptoId, name: 'Bitcoin', symbol: 'BTC' });
const ethereum = createAsset({ cryptoId: 'ethereum' as CryptoId, name: 'Ethereum', symbol: 'ETH' });
const solana = createAsset({ cryptoId: 'solana' as CryptoId, name: 'Solana', symbol: 'SOL' });

const createBalance = (fiatAmount: BaseCurrencyAmount | null): TradeableAssetBalance => ({
    cryptoAmount: '1',
    fiatAmount,
});

const createBalances = (
    fiatAmountByCryptoId: Record<string, string | null>,
): TradeableAssetBalances =>
    new Map(
        Object.entries(fiatAmountByCryptoId).map(([cryptoId, fiatAmount]) => [
            cryptoId as CryptoId,
            createBalance(
                fiatAmount === null ? null : asBaseCurrencyAmount(new BigNumber(fiatAmount)),
            ),
        ]),
    );

const threshold = asBaseCurrencyAmount(new BigNumber('0.1'));
type OrderAssetsParams = {
    assets: TestAsset[];
    balances?: TradeableAssetBalances;
    thresholdAmount?: BaseCurrencyAmount | null;
};

const orderAssets = ({
    assets,
    balances = new Map(),
    thresholdAmount = threshold,
}: OrderAssetsParams) =>
    orderTradeableAssetsByOwnership({
        assets,
        balances,
        threshold: thresholdAmount,
        getAssetCryptoId,
    });

const searchAssets = (assets: TestAsset[], search: string) =>
    filterTradeableAssetsBySearch({
        assets,
        searchIndex: buildTradeableAssetSearchIndex({ assets, getSearchFields }),
        search,
    });

describe('orderTradeableAssetsByOwnership', () => {
    it('puts the featured assets first in their fixed order', () => {
        const token = createAsset();

        expect(orderAssets({ assets: [solana, token, ethereum, bitcoin] })).toEqual([
            bitcoin,
            ethereum,
            solana,
            token,
        ]);
    });

    it('puts owned assets after the featured ones, ordered by fiat value', () => {
        const cheapToken = createAsset({ cryptoId: 'ethereum--0xcheap' as CryptoId });
        const pricyToken = createAsset({ cryptoId: 'ethereum--0xpricy' as CryptoId });
        const unownedToken = createAsset({ cryptoId: 'ethereum--0xunowned' as CryptoId });
        const balances = createBalances({
            'ethereum--0xcheap': '5',
            'ethereum--0xpricy': '500',
        });

        expect(
            orderAssets({ assets: [cheapToken, unownedToken, pricyToken, bitcoin], balances }),
        ).toEqual([bitcoin, pricyToken, cheapToken, unownedToken]);
    });

    it('does not count an asset worth exactly the threshold as owned', () => {
        const thresholdToken = createAsset({ cryptoId: 'ethereum--0xthreshold' as CryptoId });
        const ownedToken = createAsset({ cryptoId: 'ethereum--0xowned' as CryptoId });
        const balances = createBalances({
            'ethereum--0xthreshold': '0.1',
            'ethereum--0xowned': '0.11',
        });

        expect(orderAssets({ assets: [thresholdToken, ownedToken], balances })).toEqual([
            ownedToken,
            thresholdToken,
        ]);
    });

    it('keeps the incoming order for assets without a fiat amount or threshold', () => {
        const ratelessToken = createAsset({ cryptoId: 'ethereum--0xrateless' as CryptoId });
        const pricyToken = createAsset({ cryptoId: 'ethereum--0xpricy' as CryptoId });
        const balances = createBalances({
            'ethereum--0xrateless': null,
            'ethereum--0xpricy': '500',
        });

        expect(orderAssets({ assets: [ratelessToken, pricyToken], balances })).toEqual([
            pricyToken,
            ratelessToken,
        ]);
        expect(
            orderAssets({ assets: [ratelessToken, pricyToken], balances, thresholdAmount: null }),
        ).toEqual([ratelessToken, pricyToken]);
    });
});

describe('filterTradeableAssetsBySearch', () => {
    it('keeps the incoming order when the search is empty', () => {
        expect(searchAssets([solana, bitcoin], '  ')).toEqual([solana, bitcoin]);
    });

    it('drops assets that match nothing', () => {
        expect(searchAssets([solana, bitcoin], 'nonexistent')).toEqual([]);
    });

    it('ranks an exact name match over a name that only starts with the query', () => {
        const tether = createAsset({ cryptoId: 'ethereum--0xtether' as CryptoId, name: 'Tether' });
        const tetherUsdt = createAsset({
            cryptoId: 'ethereum--0xtetherusdt' as CryptoId,
            name: 'Tether USDT',
        });

        expect(searchAssets([tetherUsdt, tether], 'tether')).toEqual([tether, tetherUsdt]);
    });

    it('ranks a symbol match over a name that only contains the query', () => {
        const wrappedEther = createAsset({
            cryptoId: 'ethereum--0xweth' as CryptoId,
            name: 'Wrapped Ether',
            symbol: 'ETH',
        });

        expect(searchAssets([wrappedEther, ethereum], 'eth')).toEqual([ethereum, wrappedEther]);
    });

    it('falls back to the asset name for equally ranked matches', () => {
        const zebraCoin = createAsset({
            cryptoId: 'ethereum--0xzebra' as CryptoId,
            name: 'Zebra Coin',
        });
        const alphaCoin = createAsset({
            cryptoId: 'ethereum--0xalpha' as CryptoId,
            name: 'Alpha Coin',
        });

        expect(searchAssets([zebraCoin, alphaCoin], 'coin')).toEqual([alphaCoin, zebraCoin]);
    });

    it('ranks asset matches over network matches and contract matches last', () => {
        const contractMatch = createAsset({
            cryptoId: 'ethereum--0xsolana' as CryptoId,
            name: 'Token',
            symbol: 'TKN',
            contractAddress: '0xsolana',
        });
        const networkMatch = createAsset({
            cryptoId: 'solana--0xother' as CryptoId,
            name: 'Other',
            symbol: 'OTH',
            networkName: 'Solana',
            networkSymbol: 'sol',
            contractAddress: '0xother',
        });

        expect(searchAssets([contractMatch, networkMatch, solana], 'solana')).toEqual([
            solana,
            networkMatch,
            contractMatch,
        ]);
    });
});
