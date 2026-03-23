import type { CryptoId } from 'invity-api';

import { type TokenAddress } from '@suite-common/wallet-types';
import { type TradeableAsset } from '@suite-native/trading-types';

export const btcAsset: TradeableAsset = {
    symbol: 'BTC',
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    cryptoId: 'bitcoin' as CryptoId,
    networkId: 'bitcoin',
};

export const ethAsset: TradeableAsset = {
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    cryptoId: 'ethereum' as CryptoId,
    networkId: 'ethereum',
};

export const usdcAsset: TradeableAsset = {
    symbol: 'USDC',
    name: 'USDC',
    coingeckoId: 'usd-coin',
    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    networkId: 'ethereum',
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
};

export const usdtAsset: TradeableAsset = {
    symbol: 'USDT',
    name: 'Tether USDT',
    coingeckoId: 'tether',
    cryptoId: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
    networkId: 'ethereum',
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress,
};

export const adaAsset: TradeableAsset = {
    symbol: 'ADA',
    name: 'Cardano',
    coingeckoId: 'cardano',
    cryptoId: 'cardano' as CryptoId,
    networkId: 'cardano',
};

export const ethOnBaseAsset: TradeableAsset = {
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    cryptoId: 'base--0x0000000000000000000000000000000000000000' as CryptoId,
    networkId: 'base',
};

export const rethOnBaseAsset: TradeableAsset = {
    symbol: 'RETH',
    name: 'Rocket Pool ETH',
    coingeckoId: 'rocket-pool-eth',
    cryptoId: 'base--0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c' as CryptoId,
    networkId: 'base',
};

export const jitoOnSolanaAsset: TradeableAsset = {
    cryptoId: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL' as CryptoId,
    symbol: 'JTO',
    name: 'Jito',
    coingeckoId: 'jito-governance-token',
    networkId: 'solana',
};

export const jupOnSolanaAsset: TradeableAsset = {
    cryptoId: 'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as CryptoId,
    symbol: 'JUP',
    name: 'Jupiter',
    coingeckoId: 'jupiter-exchange-solana',
    networkId: 'solana',
};

export const usdtOnArbAsset: TradeableAsset = {
    cryptoId: 'arbitrum-one--0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as CryptoId,
    symbol: 'USDT',
    name: 'Tether',
    coingeckoId: 'fake-coingecko-id',
    networkId: 'arbitrum-one',
};

export const usdtOnBscAsset: TradeableAsset = {
    cryptoId: 'binance-smart-chain--0xe02df9e3e622debdd69fb838bb799e3f168902c5' as CryptoId,
    symbol: 'USDT',
    name: 'Tether',
    coingeckoId: 'binance-smart-chain',
    networkId: 'binance-smart-chain',
};

export const bnbAsset: TradeableAsset = {
    cryptoId: 'binancecoin' as CryptoId,
    symbol: 'BNB',
    name: 'BNB',
    coingeckoId: 'binancecoin',
    networkId: 'binancecoin',
};

export const tronTetherAsset: TradeableAsset = {
    coingeckoId: 'tether',
    contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' as TokenAddress,
    cryptoId: 'tron--TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' as CryptoId,
    name: 'Tether',
    networkId: 'tron',
    symbol: 'USDT',
};

export const tronAsset: TradeableAsset = {
    coingeckoId: 'tron',
    cryptoId: 'tron' as CryptoId,
    name: 'TRON',
    networkId: 'tron',
    symbol: 'TRX',
};

export const rippleAsset: TradeableAsset = {
    coingeckoId: 'ripple',
    cryptoId: 'ripple' as CryptoId,
    name: 'XRP',
    networkId: 'ripple',
    symbol: 'XRP',
};

export const unknownAsset: TradeableAsset = {
    coingeckoId: 'fake-coingecko-id',
    cryptoId: 'fake-crypto-id' as CryptoId,
    name: 'Fake Asset',
    networkId: 'fake-network-id',
    symbol: 'FAKE',
};
