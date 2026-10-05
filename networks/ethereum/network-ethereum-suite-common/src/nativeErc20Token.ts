import {
    getNativeErc20Token as getEthereumNativeErc20Token,
    isSupportedEthereumNetwork,
} from '@trezor/network-ethereum/constants';
import type { NetworkSymbol } from '@trezor/network-module-types';

/**
 * TODO: Migrate callers to keep native-ERC-20-token logic inside the Ethereum module.
 * @deprecated This helper must NEVER be called from outside the Ethereum module.
 * Inside the module, use getEthereumNativeErc20Token from
 * `@trezor/network-ethereum/constants` directly.
 */
export const getNativeErc20Token = (networkSymbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(networkSymbol)) {
        return undefined;
    }

    return getEthereumNativeErc20Token(networkSymbol);
};
