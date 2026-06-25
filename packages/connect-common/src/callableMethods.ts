import type { CallMethodKeys } from './events/call';

const connectCallableMethodGroups = {
    management: [
        'getFirmwareHash',
        'resetDevice',
        'loadDevice',
        'recoveryDevice',
        'wipeDevice',
        'backupDevice',
        'changePin',
        'changeWipeCode',
        'changeLanguage',
        'applySettings',
        'applyFlags',
        'authenticateDevice',
        'setBusy',
        'setBrightness',
        'bleUnpair',
        'thpGetCredentials',
        'thpRemoveCredentials',
        'telemetryGet',
        'pingDevice',
        'getNonce',
        'getSettings',
    ],
    device: [
        'getFeatures',
        'getDeviceState',
        'firmwareUpdate',
        'showDeviceTutorial',
        'requestLogin',
        'cipherKeyValue',
        'unlockPath',
        'getOwnershipId',
        'getOwnershipProof',
    ],
    blockchain: [
        'blockchainSubscribe',
        'blockchainUnsubscribe',
        'blockchainDisconnect',
        'blockchainSetCustomBackend',
        'blockchainGetInfo',
        'blockchainValidateEvmRpcUrl',
        'blockchainEstimateFee',
        'blockchainGetAccountBalanceHistory',
        'blockchainGetTransactions',
        'blockchainEvmRpcCall',
        'blockchainGetCurrentFiatRates',
        'blockchainGetContractInfo',
        'blockchainGetFiatRatesForTimestamps',
        'blockchainSubscribeFiatRates',
        'blockchainUnsubscribeFiatRates',
        'pushTransaction',
    ],
    account: [
        'getAddress',
        'getPublicKey',
        'getAccountInfo',
        'discoverAccounts',
        'selectAccount',
        'signMessage',
        'verifyMessage',
        'getCoinInfo',
    ],
    bitcoin: [
        'signTransaction',
        'composeTransaction',
        'authorizeCoinjoin',
        'cancelCoinjoinAuthorization',
    ],
    ethereum: [
        'ethereumGetAddress',
        'ethereumGetPublicKey',
        'ethereumSignTransaction',
        'ethereumSignMessage',
        'ethereumSignTypedData',
        'ethereumVerifyMessage',
    ],
    cardano: [
        'cardanoGetAddress',
        'cardanoGetPublicKey',
        'cardanoGetNativeScriptHash',
        'cardanoSignTransaction',
        'cardanoSignMessage',
        'cardanoComposeTransaction',
    ],
    monero: [
        'moneroGetAddress',
        'moneroGetWatchKey',
        'moneroKeyImageSync',
        'moneroSignTransaction',
    ],
    ripple: ['rippleGetAddress', 'rippleSignTransaction'],
    solana: [
        'solanaGetAddress',
        'solanaGetPublicKey',
        'solanaSignTransaction',
        'solanaComposeTransaction',
    ],
    stellar: ['stellarGetAddress', 'stellarSignTransaction'],
    tezos: ['tezosGetAddress', 'tezosGetPublicKey', 'tezosSignTransaction'],
    tron: ['tronGetAddress', 'tronSignTransaction', 'tronComposeTransaction'],
    evolu: ['evoluGetNode', 'evoluSignRegistrationRequest', 'evoluGetDelegatedIdentityKey'],
    nostr: ['nostrGetPublicKey', 'nostrSignEvent'],
} as const;

type AssertNever<T extends never> = T;
type ConnectCallableMethod =
    (typeof connectCallableMethodGroups)[keyof typeof connectCallableMethodGroups][number];

export type MissingConnectCallableMethods = Exclude<CallMethodKeys, ConnectCallableMethod>;
export type ExtraConnectCallableMethods = Exclude<ConnectCallableMethod, CallMethodKeys>;

export type ConnectCallableMethodsMissingGuard = AssertNever<MissingConnectCallableMethods>;
export type ConnectCallableMethodsExtraGuard = AssertNever<ExtraConnectCallableMethods>;

export const connectCallableMethods = Object.values(
    connectCallableMethodGroups,
).flat() as CallMethodKeys[];
