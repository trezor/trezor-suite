import { getSupportedNetworks } from '@suite-common/wallet-config';

import { type StorageLoadPayload } from './StorageLoadPayload';

/**
 * What `loadStoragePayload` returns for an empty database; the shared type keeps both in sync.
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
    tradeApiInstallSalt: undefined,
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
    referAFriend: undefined,
});
