import type { Protocol } from '@trezor/network-module-suite-common-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';

export type FindNetworkSymbolForProtocol = (protocol: Protocol) => NetworkSymbol | null;

export type FindNetworkSymbolForProtocolDeps = GetNetworkConfigDep & NetworkModuleRepositoryDep;

export type FindNetworkSymbolForProtocolDep = {
    findNetworkSymbolForProtocol: FindNetworkSymbolForProtocol;
};

export const selectFindNetworkSymbolForProtocolDep = (
    services: any,
): FindNetworkSymbolForProtocolDep => ({
    findNetworkSymbolForProtocol: services.findNetworkSymbolForProtocol,
});

export const createFindNetworkSymbolForProtocol =
    (deps: FindNetworkSymbolForProtocolDeps): FindNetworkSymbolForProtocol =>
    protocol =>
        deps.networkModuleRepository
            .getSupportedNetworks()
            .find(networkSymbol =>
                deps.getNetworkConfig(networkSymbol).protocols.includes(protocol),
            ) ?? null;
