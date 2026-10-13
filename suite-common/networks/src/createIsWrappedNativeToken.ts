import type { IsWrappedNativeToken as NetworkIsWrappedNativeToken } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';

export type IsWrappedNativeTokenDeps = NetworkModuleRepositoryDep;

export type IsWrappedNativeToken = NetworkIsWrappedNativeToken<NetworkSymbol>;

export type IsWrappedNativeTokenDep = { isWrappedNativeToken: IsWrappedNativeToken };

export const createIsWrappedNativeToken =
    (deps: IsWrappedNativeTokenDeps): IsWrappedNativeToken =>
    (symbol, contract) => {
        if (!contract || !deps.networkModuleRepository.isSupportedNetwork(symbol)) return false;

        return (
            deps.networkModuleRepository.get(symbol).isWrappedNativeToken?.(symbol, contract) ??
            false
        );
    };

export const injectIsWrappedNativeToken = (services: {
    networks: IsWrappedNativeTokenDep;
}): IsWrappedNativeTokenDep => ({
    isWrappedNativeToken: services.networks.isWrappedNativeToken,
});
