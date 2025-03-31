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

export const rethOnBaseAsset: TradeableAsset = {
    symbol: 'reth',
    name: 'Rocket Pool ETH',
    coingeckoId: 'rocket-pool-eth',
    cryptoId: 'base--0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c' as CryptoId,
    networkId: 'base',
};

export const jitoOnSolanaAsset: TradeableAsset = {
    cryptoId: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL' as CryptoId,
    symbol: 'jto',
    name: 'Jito',
    coingeckoId: 'jito-governance-token',
    networkId: 'solana',
};

export const jupOnSolanaAsset: TradeableAsset = {
    cryptoId: 'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as CryptoId,
    symbol: 'jup',
    name: 'Jupiter',
    coingeckoId: 'jupiter-exchange-solana',
    networkId: 'solana',
};

export const usdtOnArbAsset: TradeableAsset = {
    cryptoId: 'arbitrum-one--0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as CryptoId,
    symbol: 'usdt',
    name: 'Tether',
    coingeckoId: 'fake-coingecko-id',
    networkId: 'arbitrum-one',
};

export const usdtOnBscAsset: TradeableAsset = {
    cryptoId: 'binance-smart-chain--0xe02df9e3e622debdd69fb838bb799e3f168902c5' as CryptoId,
    symbol: 'usdt',
    name: 'Tether',
    coingeckoId: 'binance-smart-chain',
    networkId: 'binance-smart-chain',
};
