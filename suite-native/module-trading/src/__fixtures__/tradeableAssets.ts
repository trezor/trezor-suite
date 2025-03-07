import { CryptoId } from 'invity-api';

import { TradeableAsset } from '../types';

export const btcAsset: TradeableAsset = {
    symbol: 'btc',
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    cryptoId: 'bitcoin' as CryptoId,
    networkId: 'bitcoin',
};

export const usdcAsset: TradeableAsset = {
    symbol: 'eth',
    name: 'USDC',
    coingeckoId: 'usd-coin',
    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    networkId: 'ethereum',
};

export const adaAsset: TradeableAsset = {
    symbol: 'ada',
    name: 'Cardano',
    coingeckoId: 'cardano',
    cryptoId: 'cardano' as CryptoId,
    networkId: 'cardano',
};
