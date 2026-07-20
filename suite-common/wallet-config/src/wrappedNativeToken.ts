import { type NetworkSymbol } from './types';

type WrappedNativeToken = {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
};

export const WRAPPED_NATIVE: Partial<Record<NetworkSymbol, WrappedNativeToken>> = {
    eth: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
    op: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
    bsc: { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', decimals: 18 },
    etc: { address: '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a', symbol: 'WETC', decimals: 18 },
    // Polygon migration from WMATIC to WPOL is done only on the interface level. Contract symbol() still returns WMATIC.
    pol: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WPOL', decimals: 18 },
    base: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
    arb: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
    avax: { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', symbol: 'WAVAX', decimals: 18 },

    // --- testnets ---
    tsep: { address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', symbol: 'WETH', decimals: 18 },
    thod: { address: '0xE0decAa66aED871ac9eb924443D1Bf333Fdb062E', symbol: 'WETH', decimals: 18 },
};

export const getWrappedNativeAddress = (networkSymbol: NetworkSymbol) =>
    WRAPPED_NATIVE[networkSymbol]?.address;

export const getWrappedNativeSymbol = (networkSymbol: NetworkSymbol) =>
    WRAPPED_NATIVE[networkSymbol]?.symbol;
