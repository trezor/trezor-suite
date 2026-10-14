import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';

export type GetAccountSyncIntervalDeps = NetworkModuleRepositoryDep;

export type GetAccountSyncInterval = (symbol: NetworkSymbol) => number;

export type GetAccountSyncIntervalDep = {
    getAccountSyncInterval: GetAccountSyncInterval;
};

export const createGetAccountSyncInterval =
    (deps: GetAccountSyncIntervalDeps): GetAccountSyncInterval =>
    symbol =>
        deps.networkModuleRepository.get(symbol).getAccountSyncInterval(symbol);

export const injectGetAccountSyncInterval = (services: any): GetAccountSyncIntervalDep => ({
    getAccountSyncInterval: services.networks.getAccountSyncInterval,
});
