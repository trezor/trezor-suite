import { type NetworkSymbol } from './types';

// Keys must be stored lowercase — isWrappedNativeToken compares lowercased addresses.
const WRAPPED_NATIVE_TOKEN_CONTRACT: Partial<Record<NetworkSymbol, `0x${string}`>> = {
    eth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
};

// Pinned so value-carrying wrap/unwrap conversions never scale by token
// metadata coming from a remote API or account token info.
export const WRAPPED_NATIVE_TOKEN_DECIMALS = 18;

export const getWrappedNativeAddress = (networkSymbol: NetworkSymbol) =>
    WRAPPED_NATIVE_TOKEN_CONTRACT[networkSymbol];

export const isWrappedNativeToken = (
    networkSymbol: NetworkSymbol,
    contractAddress?: string | null,
): boolean =>
    !!contractAddress &&
    WRAPPED_NATIVE_TOKEN_CONTRACT[networkSymbol] === contractAddress.toLowerCase();
