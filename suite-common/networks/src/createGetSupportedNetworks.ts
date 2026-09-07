import { typedObjectValues } from '@trezor/utils';

import type { NetworkSymbol, StaticNetworkModulesDep } from './NetworkModules';

export type GetSupportedNetworksDeps = StaticNetworkModulesDep;

export type GetSupportedNetworks = () => readonly NetworkSymbol[];

export type GetSupportedNetworksDep = {
    getSupportedNetworks: GetSupportedNetworks;
};

export const selectGetSupportedNetworksDep = (services: any): GetSupportedNetworksDep => ({
    getSupportedNetworks: services.networks.getSupportedNetworks,
});

export const createGetSupportedNetworks = (
    deps: GetSupportedNetworksDeps,
): GetSupportedNetworks => {
    const supportedNetworks: readonly NetworkSymbol[] = Array.from(
        new Set(
            typedObjectValues(deps.networkModules).flatMap<NetworkSymbol>(networkModule =>
                networkModule.getSupportedNetworks(),
            ),
        ),
    );

    return () => supportedNetworks;
};
