import type { AddressValidator } from '@suite-common/address';
import type { AnalyticsSharedEvents } from '@suite-common/analytics';
import { type Bip329 } from '@suite-common/bip329-types';
import type { NetworkModuleRepository, NetworkSymbol } from '@suite-common/networks';
import {
    mockFindNetworkSymbolForProtocol,
    mockGetNetworkConfig,
} from '@suite-common/networks/mocks';
import {
    type EncryptableBranded,
    type EncryptedHex,
    type PlatformEncryption,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import {
    type ConnectInitSettings,
    type ExtraDependencies,
    notImplementedAction,
    notImplementedActionType,
    notImplementedGetter,
    notImplementedReducer,
    notImplementedThunk,
} from '@suite-common/redux-utils';
import type { SuiteSync } from '@suite-common/suite-sync-types';
import { type ReportSecurityCheckParams, asDelegatedIdentityKey } from '@suite-common/suite-types';
import { type SelectedAccountLoaded, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { err, ok } from '@trezor/type-utils';
import { createKeyedThrottle } from '@trezor/utils';

const suiteSyncMock: SuiteSync = {
    changeRelayUrl: () => Promise.resolve(),
    disconnectAllRelays: () => Promise.resolve(),
    reconnectAllRelays: () => Promise.resolve(),
    ensureWalletSuiteSyncOn: () =>
        Promise.resolve(err({ type: 'SuiteSyncUnavailableOnDeviceError' })),
    ensureWalletSuiteSyncOnUncontrolled: () => Promise.resolve(),
    turnOffSuiteSyncForWallet: () => Promise.resolve(),
    turnOnSuiteSync: () => Promise.resolve(ok()),
    turnOffSuiteSync: () => Promise.resolve(),
    dangerouslyWipeAllLabelsFromWallet: () => Promise.resolve(ok()),
    labeling: {
        updateAccountLabel: () => Promise.resolve(ok()),
        updateAddressLabel: () => Promise.resolve(ok()),
        updateOutputLabel: () => Promise.resolve(ok()),
        updateWalletLabel: () => Promise.resolve(ok()),
    },
};

const bip329Mock: Bip329 = {
    export: () => ({ accountLabel: null, labelsToExport: [] }),
    import: () => Promise.resolve(ok()),
};

const platformEncryptionMock: PlatformEncryption = {
    encrypt: <T extends EncryptableBranded>({ value }: { value: T }) =>
        Promise.resolve(ok(asEncryptedHex(value))),

    decrypt: <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) =>
        Promise.resolve(ok(value as unknown as T)),
};

const analyticsMock = mockAnalytics<AnalyticsSharedEvents>();

const addressValidatorMock: AddressValidator = {
    isAddressValid: () => false,
    getAddressType: () => undefined,
};

const networkModuleRepositoryMock: NetworkModuleRepository = {
    get: () => {
        throw new Error('Network module repository mock is not implemented.');
    },
    getSupportedNetworks: () => [],
    isSupportedNetwork: (_symbol: string): _symbol is NetworkSymbol => false,
};

const connectInitSettings: ConnectInitSettings = {
    debug: false,
    manifest: {
        email: 'info@trezor.io',
        appName: 'Trezor Suite',
        appUrl: '@suite-native/app',
    },
};

export const extraDependenciesCommonMock: ExtraDependencies = {
    thunks: {
        fetchAndSaveMetadata: notImplementedThunk('fetchAndSaveMetadata'),
        initMetadata: notImplementedThunk('initMetadata'),
        addAccountMetadata: notImplementedThunk('addAccountMetadata'),
        forgetBluetoothDevice: notImplementedThunk('forgetBluetoothDevice'),
    },
    services: {
        addressValidator: addressValidatorMock,
        getNetworkConfig: mockGetNetworkConfig,
        findNetworkSymbolForProtocol: mockFindNetworkSymbolForProtocol,
        networkModuleRepository: networkModuleRepositoryMock,
        suiteSync: suiteSyncMock,
        bip329: bip329Mock,
        ensureDelegatedIdentityKey: () =>
            Promise.resolve(ok(asDelegatedIdentityKey('mockDelegatedIdentityKey'))),
        platformEncryption: platformEncryptionMock,
        analytics: analyticsMock,
        reportSecurityCheck: ({ level, checkType }: ReportSecurityCheckParams) =>
            console.warn(`Mock reporting ${checkType} check ${level} to Sentry.`),
        reloadApp: () => {},
        saveAs: (data, fileName) =>
            console.warn(
                `Save data: ${data} into file: ${fileName}. Implementation on phone not ready.`,
            ),
        connectInitSettings,
        connectInitHooks: { deviceEvent: {}, uiEvent: {} },
        createTransports: () => [],
        accountRefreshThrottle: createKeyedThrottle(10_000, () => undefined),
        migrateSuiteSyncLabelsForRbfTransaction: () => Promise.resolve([[], []]),
        getTokenDefinitionsEnabledNetworks: notImplementedGetter(
            'getTokenDefinitionsEnabledNetworks',
            ['eth'],
        ),
        getDebugSettings: notImplementedGetter('getDebugSettings', {
            checkFirmwareAuthenticity: false,
            showDebugMenu: false,
            transports: [],
        }),
        getDesktopBinDir: notImplementedGetter('getDesktopBinDir', '/bin'),
        getLanguage: notImplementedGetter('getLanguage', 'en'),

        getSelectedAccount: notImplementedGetter('getSelectedAccount', {
            status: 'loaded',
            account: mockWalletAccount({
                symbol: 'btc',
                deviceState: '1@2:3',
                descriptor: asAccountDescriptor('btc1'),
            }),
        } as SelectedAccountLoaded),
        getSelectedAccountStatus: notImplementedGetter('getSelectedAccountStatus', 'loaded'),
        getIsWindowVisible: notImplementedGetter('getIsWindowVisible', true),
        getTradingEnvironment: notImplementedGetter('getTradingEnvironment', 'localhost'),
        getTradedAccountKeys: notImplementedGetter('getTradedAccountKeys', []),
        getIsViewOnlyByDefaultEnabled: notImplementedGetter('getIsViewOnlyByDefaultEnabled', true),
        getThpSettings: notImplementedGetter('getThpSettings', {
            pairingMethods: ['CodeEntry'],
        }),
        getAllowPrerelease: notImplementedGetter('getAllowPrerelease', false),
    },
    actions: {
        setAccountAddMetadata: notImplementedAction('setAccountAddMetadata'),
        lockDevice: notImplementedAction('lockDevice'),
        onModalCancel: notImplementedAction('onModalCancel'),
        openModal: notImplementedAction('openModal'),
    },
    actionTypes: {
        storageLoad: notImplementedActionType('storageLoad'),
        setDeviceMetadata: notImplementedActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: notImplementedActionType('setDeviceMetadataPasswords'),
    },
    reducers: {
        storageLoadBlockchain: notImplementedReducer('storageLoadBlockchain'),
        storageLoadExplorer: notImplementedReducer('storageLoadExplorer'),
        storageLoadAccounts: notImplementedReducer('storageLoadAccounts'),
        storageLoadTransactions: notImplementedReducer('storageLoadTransactions'),
        storageLoadPhishingMetadata: notImplementedReducer('storageLoadPhishingMetadata'),
        storageLoadHistoricRates: notImplementedReducer('storageLoadHistoricRates'),
        setDeviceMetadataReducer: notImplementedReducer('setDeviceMetadataReducer'),
        setDeviceMetadataPasswordsReducer: notImplementedReducer(
            'setDeviceMetadataPasswordsReducer',
        ),
        storageLoadDevices: notImplementedReducer('storageLoadDevices'),
        storageLoadFormDrafts: notImplementedReducer('storageLoadFormDrafts'),
        storageLoadTokenManagement: notImplementedReducer('storageLoadTokenManagement'),
        storageLoadWalletSettings: notImplementedReducer('storageLoadWalletSettings'),
        storageLoadBioAuth: notImplementedReducer('storageLoadBioAuth'),
        storageLoadFlags: notImplementedReducer('storageLoadFlags'),
        storageLoadSuiteSettings: notImplementedReducer('storageLoadSuiteSettings'),
        storageLoadReceiveAccounts: notImplementedReducer('storageLoadReceiveAccounts'),
    },
};
