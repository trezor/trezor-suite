import type { CallMethodKeys } from './events/call';
import type {
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectBlockchain,
    TrezorConnectCardano,
    TrezorConnectDevice,
    TrezorConnectEthereum,
    TrezorConnectEvolu,
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

export type MissingConnectCallableMethods = Exclude<CallMethodKeys, ConnectCallableMethod>;
export type ExtraConnectCallableMethods = Exclude<ConnectCallableMethod, CallMethodKeys>;

export type ConnectCallableMethodsMissingGuard = AssertNever<MissingConnectCallableMethods>;
export type ConnectCallableMethodsExtraGuard = AssertNever<ExtraConnectCallableMethods>;

export const connectCallableMethods = Object.values(
    connectCallableMethodGroups,
).flat() as CallMethodKeys[];
