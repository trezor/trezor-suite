import type { CallMethodKeys } from './events/call';
import type { TrezorConnectManagement } from './types/api/management';

type AssertNever<T extends never> = T;

const connectManagementMethods = [
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
] as const;

type ManagementKey = keyof TrezorConnectManagement;
type ManagementItem = (typeof connectManagementMethods)[number];
export type ManagementMissingGuard = AssertNever<Exclude<ManagementKey, ManagementItem>>;
export type ManagementExtraGuard = AssertNever<Exclude<ManagementItem, ManagementKey>>;

const connectPublicCallableMethodGroups = {
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
        'blockchainEvmRpcGetChainId',
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
        'sendTransaction',
        'signTransaction',
        'composePsbt',
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
        'ethereumSignAuth7702',
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
        'solanaSignMessage',
        'solanaComposeTransaction',
    ],
    stellar: ['stellarGetAddress', 'stellarSignTransaction'],
    tezos: ['tezosGetAddress', 'tezosGetPublicKey', 'tezosSignTransaction'],
    tron: ['tronGetAddress', 'tronSignTransaction', 'tronComposeTransaction'],
    evolu: ['evoluGetNode', 'evoluSignRegistrationRequest', 'evoluGetDelegatedIdentityKey'],
    nostr: ['nostrGetPublicKey', 'nostrSignEvent'],
} as const;

export const connectPublicCallableMethods = Object.values(connectPublicCallableMethodGroups).flat();

type PublicKey = Exclude<CallMethodKeys, keyof TrezorConnectManagement>;
type PublicItem = (typeof connectPublicCallableMethods)[number];
export type PublicMissingGuard = AssertNever<Exclude<PublicKey, PublicItem>>;
export type PublicExtraGuard = AssertNever<Exclude<PublicItem, PublicKey>>;

export const connectCallableMethods = [
    ...connectPublicCallableMethods,
    ...connectManagementMethods,
];
