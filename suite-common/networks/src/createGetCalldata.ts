import { type Calldata } from '@trezor/calldata';

import { type NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import { type NetworkSymbol } from './NetworkModules';

export type GetCalldata = (symbol: NetworkSymbol | null | undefined) => Calldata | undefined;
export type GetCalldataDep = { getCalldata: GetCalldata };
export type GetCalldataDeps = NetworkModuleRepositoryDep;

export const createGetCalldata =
    (deps: GetCalldataDeps): GetCalldata =>
    symbol =>
        symbol ? deps.networkModuleRepository.get(symbol).calldata : undefined;

export const injectGetCalldata = (services: any): GetCalldataDep => ({
    getCalldata: services.networks.getCalldata,
});

export type GetCalldataThunkDeps = { services: { networks: GetCalldataDep } };
