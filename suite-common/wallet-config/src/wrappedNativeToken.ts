import {
    WRAPPED_NATIVE as ETHEREUM_WRAPPED_NATIVE,
    getWrappedNativeAddress as getEthereumWrappedNativeAddress,
    getWrappedNativeSymbol as getEthereumWrappedNativeSymbol,
    isWrappedNativeToken as isEthereumWrappedNativeToken,
    isSupportedEthereumNetwork,
} from '@trezor/network-ethereum/constants';

import { type NetworkSymbol } from './types';

type WrappedNativeToken = (typeof ETHEREUM_WRAPPED_NATIVE)[keyof typeof ETHEREUM_WRAPPED_NATIVE];

export const WRAPPED_NATIVE: Partial<Record<NetworkSymbol, WrappedNativeToken>> =
    ETHEREUM_WRAPPED_NATIVE;

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
