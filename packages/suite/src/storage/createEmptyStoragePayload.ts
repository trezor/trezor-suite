import { getSupportedNetworks } from '@suite-common/wallet-config';

import { type StorageLoadPayload } from './StorageLoadPayload';

/**
 * The `@storage/load` payload an empty database produces: every key `loadStoragePayload` reads,
 * `[]` for the stores read as lists and `undefined` for single records. Typed against the loader's
 * result so that a new store changes both at once; automation seeds merge their slices over it.
 */
export const createEmptyStoragePayload = (): StorageLoadPayload => ({
    supportedNetworks: getSupportedNetworks(),
    suiteSettings: undefined,
    walletSettings: undefined,
    devices: [],
    thp: undefined,
    bluetooth: undefined,
    accounts: [],
    txs: [],
    phishing: [],
    phishingMetadata: undefined,
    graph: [],
    tradingTrades: [],
    historicRates: [],
    sendFormDrafts: [],
    receive: [],
    formDrafts: [],
    analytics: undefined,
    metadata: undefined,
    messageSystem: undefined,
    backendSettings: [],
    coinjoinAccounts: [],
    coinjoinDebugSettings: undefined,
    tokenManagement: [],
    stellarContractTokens: [],
    persistentDeviceData: undefined,
    bioAuth: undefined,
    connect: undefined,
    explorer: [],
    firmware: undefined,
    suiteSyncSettings: undefined,
    suiteSyncOwners: [],
    suiteSyncQuotaManager: undefined,
    featureFeedback: undefined,
    discreetMode: undefined,
    debug: undefined,
    earnOnboarding: [],
});
