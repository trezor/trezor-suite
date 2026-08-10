import {
    getWrappedNativeAddress as getEthereumWrappedNativeAddress,
    getWrappedNativeSymbol as getEthereumWrappedNativeSymbol,
    getWrappedNativeToken as getEthereumWrappedNativeToken,
    isWrappedNativeToken as isEthereumWrappedNativeToken,
    isSupportedEthereumNetwork,
} from '@trezor/network-ethereum/constants';

// TODO(#30663): Replace `string` with the shared branded `NetworkSymbol` after
// #30561 is merged.
export const getWrappedNativeToken = (networkSymbol: string) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeToken(networkSymbol);
};

// TODO(#30663): Replace `string` with the shared branded `NetworkSymbol` after
// #30561 is merged.
export const getWrappedNativeAddress = (networkSymbol: string) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeAddress(networkSymbol);
};

// TODO(#30663): Replace `string` with the shared branded `NetworkSymbol` after
// #30561 is merged.
export const getWrappedNativeSymbol = (networkSymbol: string) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumWrappedNativeSymbol(networkSymbol);
};

// TODO(#30663): Replace `string` with the shared branded `NetworkSymbol` after
// #30561 is merged.
export const isWrappedNativeToken = (
    networkSymbol: string,
    contractAddress?: string | null,
): boolean => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return false;
    }

    return isEthereumWrappedNativeToken(networkSymbol, contractAddress);
};
