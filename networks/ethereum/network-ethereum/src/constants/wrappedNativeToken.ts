import type { EthereumNetworkSymbol } from './networkSymbol';

type WrappedNativeToken = {
    readonly address: `0x${string}`;
    readonly symbol: string;
    readonly decimals: number;
};

// Complete record over supported Ethereum networks, so adding one without its wrapped native token fails type-check.
export const WRAPPED_NATIVE: Readonly<Record<EthereumNetworkSymbol, WrappedNativeToken>> = {
    eth: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
    op: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
    bsc: { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', decimals: 18 },
    etc: { address: '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a', symbol: 'WETC', decimals: 18 },
    // Polygon migration from WMATIC to WPOL is done only on the interface level. Contract symbol() still returns WMATIC.
    pol: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WPOL', decimals: 18 },
    base: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
    arb: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
    rhc: { address: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73', symbol: 'WETH', decimals: 18 },
    hype: { address: '0x5555555555555555555555555555555555555555', symbol: 'WHYPE', decimals: 18 },
    avax: { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', symbol: 'WAVAX', decimals: 18 },

    // --- testnets ---
    tsep: { address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', symbol: 'WETH', decimals: 18 },
    thod: { address: '0xE0decAa66aED871ac9eb924443D1Bf333Fdb062E', symbol: 'WETH', decimals: 18 },
};

export const getWrappedNativeToken = (networkSymbol: EthereumNetworkSymbol) =>
    WRAPPED_NATIVE[networkSymbol];

export const getWrappedNativeAddress = (networkSymbol: EthereumNetworkSymbol) =>
    getWrappedNativeToken(networkSymbol).address;

export const getWrappedNativeSymbol = (networkSymbol: EthereumNetworkSymbol) =>
    getWrappedNativeToken(networkSymbol).symbol;

export const isWrappedNativeToken = (
    networkSymbol: EthereumNetworkSymbol,
    contractAddress?: string | null,
): boolean => {
    const wrappedNativeAddress = getWrappedNativeAddress(networkSymbol);

    // TLRD: Don't use `areEvmAddressesEqual` here as it would drag wasm-adjacent dependencies into its webpack build (and that break `build-connect`).
    //
    // Checksum-agnostic equality. One side is always a known-valid WRAPPED_NATIVE constant, so a
    // case-insensitive comparison is equivalent to a full EVM address comparison — and it keeps
    // this module dependency-free for light consumers (e.g. connect-explorer reaches it through
    // the design system's TokenIcon, where an EVM address library would drag wasm-adjacent
    // dependencies into its webpack build).
    return (
        !!contractAddress && wrappedNativeAddress.toLowerCase() === contractAddress.toLowerCase()
    );
};
