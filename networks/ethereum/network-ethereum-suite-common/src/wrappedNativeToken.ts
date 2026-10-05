import {
    getWrappedNativeAddress as getEthereumWrappedNativeAddress,
    getWrappedNativeSymbol as getEthereumWrappedNativeSymbol,
    getWrappedNativeToken as getEthereumWrappedNativeToken,
    isWrappedNativeToken as isEthereumWrappedNativeToken,
} from '@trezor/network-ethereum/constants';
import { isSupportedEthereumNetwork } from '@trezor/network-ethereum-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

/**
 * TODO: Migrate callers to keep wrapped-native-token logic inside the Ethereum module.
 * @deprecated This helper must NEVER be called from outside the Ethereum module.
 * Inside the module, use getEthereumWrappedNativeToken from
 * `@trezor/network-ethereum/constants` directly.
 */
export const getWrappedNativeToken = (networkSymbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeToken(networkSymbol);
};

/**
 * TODO: Migrate callers to keep wrapped-native-token logic inside the Ethereum module.
 * @deprecated This helper must NEVER be called from outside the Ethereum module.
 * Inside the module, use getEthereumWrappedNativeAddress from
 * `@trezor/network-ethereum/constants` directly.
 */
export const getWrappedNativeAddress = (networkSymbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeAddress(networkSymbol);
};

/**
 * TODO: Migrate callers to keep wrapped-native-token logic inside the Ethereum module.
 * @deprecated This helper must NEVER be called from outside the Ethereum module.
 * Inside the module, use getEthereumWrappedNativeSymbol from
 * `@trezor/network-ethereum/constants` directly.
 */
export const getWrappedNativeSymbol = (networkSymbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeSymbol(networkSymbol);
};

/**
 * TODO: Migrate callers to keep wrapped-native-token logic inside the Ethereum module.
 * @deprecated This helper must NEVER be called from outside the Ethereum module.
 * Inside the module, use isEthereumWrappedNativeToken from
 * `@trezor/network-ethereum/constants` directly.
 */
export const isWrappedNativeToken = (
    networkSymbol: NetworkSymbol,
    contractAddress?: string | null,
): boolean => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return false;
    }

    return isEthereumWrappedNativeToken(networkSymbol, contractAddress);
};
