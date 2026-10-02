import {
    getWrappedNativeAddress as getEthereumWrappedNativeAddress,
    getWrappedNativeSymbol as getEthereumWrappedNativeSymbol,
    getWrappedNativeToken as getEthereumWrappedNativeToken,
    isWrappedNativeToken as isEthereumWrappedNativeToken,
    isSupportedEthereumNetwork,
} from '@trezor/network-ethereum/constants';
import type { NetworkSymbol } from '@trezor/network-module-types';

export const getWrappedNativeToken = (networkSymbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeToken(networkSymbol);
};

export const getWrappedNativeAddress = (networkSymbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeAddress(networkSymbol);
};

export const getWrappedNativeSymbol = (networkSymbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeSymbol(networkSymbol);
};

export const isWrappedNativeToken = (
    networkSymbol: NetworkSymbol,
    contractAddress?: string | null,
): boolean => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return false;
    }

    return isEthereumWrappedNativeToken(networkSymbol, contractAddress);
};
