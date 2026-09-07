import type { Protocol } from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from './NetworkModules';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { GetSupportedNetworksDep } from './createGetSupportedNetworks';

export type FindNetworkSymbolForProtocolDeps = GetNetworkConfigDep & GetSupportedNetworksDep;

export type FindNetworkSymbolForProtocol = (protocol: Protocol) => NetworkSymbol | null;

export type FindNetworkSymbolForProtocolDep = {
    findNetworkSymbolForProtocol: FindNetworkSymbolForProtocol;
};

export const selectFindNetworkSymbolForProtocolDep = (
    services: any,
): FindNetworkSymbolForProtocolDep => ({
    findNetworkSymbolForProtocol: services.networks.findNetworkSymbolForProtocol,
});

export const createFindNetworkSymbolForProtocol =
    (deps: FindNetworkSymbolForProtocolDeps): FindNetworkSymbolForProtocol =>
    protocol =>
        deps
            .getSupportedNetworks()
            .find(networkSymbol =>
                deps.getNetworkConfig(networkSymbol).protocols.includes(protocol),
            ) ?? null;
