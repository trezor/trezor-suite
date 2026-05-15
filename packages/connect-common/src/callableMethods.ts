import type { CallMethodKeys } from './events/call';
import type {
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectBlockchain,
    TrezorConnectCardano,
    TrezorConnectDevice,
    TrezorConnectEthereum,
    TrezorConnectEvolu,
    TrezorConnectExperimental,
    TrezorConnectMonero,
    TrezorConnectRipple,
    TrezorConnectSolana,
    TrezorConnectStellar,
    TrezorConnectTezos,
    TrezorConnectTron,
} from './types/api';

type AssertNever<T extends never> = T;

type ConnectCallableMethodGroups = {
    device: readonly (keyof TrezorConnectDevice)[];
    blockchain: readonly (keyof TrezorConnectBlockchain)[];
    account: readonly (keyof TrezorConnectAccount)[];
    bitcoin: readonly (keyof TrezorConnectBitcoin)[];
    ethereum: readonly (keyof TrezorConnectEthereum)[];
    cardano: readonly (keyof TrezorConnectCardano)[];
    monero: readonly (keyof TrezorConnectMonero)[];
    ripple: readonly (keyof TrezorConnectRipple)[];
    solana: readonly (keyof TrezorConnectSolana)[];
    stellar: readonly (keyof TrezorConnectStellar)[];
    tezos: readonly (keyof TrezorConnectTezos)[];
    tron: readonly (keyof TrezorConnectTron)[];
    evolu: readonly (keyof TrezorConnectEvolu)[];
};

type ConnectExperimentalCallableMethods = readonly (keyof TrezorConnectExperimental)[];

const connectCallableMethodGroups = {
    device: [
        'getFeatures',
        'getDeviceState',
        'getFirmwareHash',
        'firmwareUpdate',
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
        'showDeviceTutorial',
        'bleUnpair',
        'requestLogin',
        'cipherKeyValue',
        'unlockPath',
        'getOwnershipId',
        'getOwnershipProof',
        'thpGetCredentials',
        'thpRemoveCredentials',
        'telemetryGet',
        'pingDevice',
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
        'getNonce',
    ],
    account: [
        'getAddress',
        'getPublicKey',
        'getAccountInfo',
        'getAccountDescriptor',
        'discoverAccounts',
        'signMessage',
        'verifyMessage',
        'getSettings',
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
} as const satisfies ConnectCallableMethodGroups;

type ConnectCallableMethod =
    (typeof connectCallableMethodGroups)[keyof typeof connectCallableMethodGroups][number];

// Methods that are exposed under `TrezorConnect.experimental.*` and gated by `init({ experimental: true })`.
// Keep this list as the single source of truth: adding a name here makes the factory generate the
// experimental wrapper and excludes the method from the "missing stable method" guard below.
export const connectExperimentalCallableMethods = [
    'experimentalEcho',
] as const satisfies ConnectExperimentalCallableMethods;

type ExperimentalCallableMethod = (typeof connectExperimentalCallableMethods)[number];

export type MissingConnectCallableMethods = Exclude<
    CallMethodKeys,
    ConnectCallableMethod | ExperimentalCallableMethod
>;
export type ExtraConnectCallableMethods = Exclude<ConnectCallableMethod, CallMethodKeys>;
export type ExtraConnectExperimentalCallableMethods = Exclude<
    ExperimentalCallableMethod,
    CallMethodKeys
>;

export type ConnectCallableMethodsMissingGuard = AssertNever<MissingConnectCallableMethods>;
export type ConnectCallableMethodsExtraGuard = AssertNever<ExtraConnectCallableMethods>;
export type ConnectExperimentalCallableMethodsExtraGuard =
    AssertNever<ExtraConnectExperimentalCallableMethods>;

export const connectCallableMethods = Object.values(
    connectCallableMethodGroups,
).flat() as CallMethodKeys[];
