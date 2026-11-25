import { isSupportedEthereumNetwork } from '@trezor/network-ethereum-types';
import { type NetworkSymbol } from '@trezor/network-module-types';

/** Normalizes lookup strings without changing addresses stored in account or catalogue metadata. */
export const normalizeTokenAddress = (networkSymbol: NetworkSymbol, address: string): string =>
    isSupportedEthereumNetwork(networkSymbol) ? address.toLowerCase() : address;
