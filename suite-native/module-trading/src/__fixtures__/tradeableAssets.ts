import { CryptoId } from 'invity-api';

import { TokenAddress } from '@suite-common/wallet-types';

import { TradeableAsset } from '../types';

export const btcAsset: TradeableAsset = {
    symbol: 'btc',
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    cryptoId: 'bitcoin' as CryptoId,
    networkId: 'bitcoin',
};

export const ethAsset: TradeableAsset = {
    symbol: 'eth',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    cryptoId: 'ethereum' as CryptoId,
    networkId: 'ethereum',
};

export const usdcAsset: TradeableAsset = {
    symbol: 'usdc',
    name: 'USDC',
    coingeckoId: 'usd-coin',
    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    networkId: 'ethereum',
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
};

export const adaAsset: TradeableAsset = {
    symbol: 'ada',
    name: 'Cardano',
    coingeckoId: 'cardano',
    cryptoId: 'cardano' as CryptoId,
    networkId: 'cardano',
};

export const ethOnBaseAsset: TradeableAsset = {
    symbol: 'eth',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    cryptoId: 'base--0x0000000000000000000000000000000000000000' as CryptoId,
    networkId: 'base',
};
