import {
    type EncryptableBranded,
    type EncryptedHex,
    type PlatformEncryption,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import {
    type ConnectInitSettings,
    type ExtraDependencies,
    type SelectedRoute,
    notImplementedAction,
    notImplementedActionType,
    notImplementedReducer,
    notImplementedSelector,
    notImplementedThunk,
} from '@suite-common/redux-utils';
import type { SuiteSync } from '@suite-common/suite-sync-types';
import { type ReportSecurityCheckParams, asDelegatedIdentityKey } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    AddressDisplayOptions,
    type SelectedAccountLoaded,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type Analytics } from '@trezor/analytics-uploader';
import { err, ok } from '@trezor/type-utils';

const suiteSyncMock: SuiteSync = {
    changeRelayUrl: () => Promise.resolve(),
    ensureWalletSuiteSyncOn: () =>
        Promise.resolve(err({ type: 'SuiteSyncUnavailableOnDeviceError' })),
    turnOffSuiteSyncForWallet: () => Promise.resolve(),
    turnOnSuiteSync: () => Promise.resolve(ok()),
    turnOffSuiteSync: () => Promise.resolve(),
    labeling: {
        updateAccountLabel: () => Promise.resolve(ok()),
        updateAddressLabel: () => Promise.resolve(ok()),
        updateOutputLabel: () => Promise.resolve(ok()),
        updateWalletLabel: () => Promise.resolve(ok()),
    },
};

const platformEncryptionMock: PlatformEncryption = {
    encrypt: <T extends EncryptableBranded>({ value }: { value: T }) =>
        Promise.resolve(ok(asEncryptedHex(value as T))),

    decrypt: <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) =>
        Promise.resolve(ok(value as unknown as T)),
};

export const analyticsMock: Analytics<any> = {
    report: () => {},
    isEnabled: () => true,
    disable: () => {},
    enable: () => {},
    setUrl: () => {},
    setLoggerEnabled: () => {},
    init: () => {},
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
        cardanoValidatePendingTxOnBlock: notImplementedThunk('validatePendingTxOnBlock'),
        fetchAndSaveMetadata: notImplementedThunk('fetchAndSaveMetadata'),
        initMetadata: notImplementedThunk('initMetadata'),
        addAccountMetadata: notImplementedThunk('addAccountMetadata'),
        forgetBluetoothDevice: notImplementedThunk('forgetBluetoothDevice'),
    },
    services: {
        suiteSync: suiteSyncMock,
        ensureDelegatedIdentityKey: () =>
            Promise.resolve(ok(asDelegatedIdentityKey('mockDelegatedIdentityKey'))),
        platformEncryption: platformEncryptionMock,
        analytics: analyticsMock,
        reportSecurityCheck: ({ level, checkType }: ReportSecurityCheckParams) =>
            console.warn(`Mock reporting ${checkType} check ${level} to Sentry.`),
        saveAs: (data, fileName) =>
            console.warn(
                `Save data: ${data} into file: ${fileName}. Implementation on phone not ready.`,
            ),
        connectInitSettings,
        migrateSuiteSyncLabelsForRbfTransaction: (_: any) => Promise.resolve([[], []]),
    },
    selectors: {
        selectTokenDefinitionsEnabledNetworks: notImplementedSelector(
            'selectTokenDefinitonsEnabledNetworks',
            ['eth'],
        ),
        selectDebugSettings: notImplementedSelector('selectDebugSettings', {
            checkFirmwareAuthenticity: false,
            showDebugMenu: false,
            transports: [],
        }),
        selectDesktopBinDir: notImplementedSelector('selectDesktopBinDir', '/bin'),
        selectRouterApp: notImplementedSelector('selectRouterApp', ''),
        selectRoute: notImplementedSelector('selectRoute', {
            name: 'suite-index',
        } satisfies SelectedRoute),
        selectMetadata: notImplementedSelector('selectMetadata', {}),
        selectDevice: notImplementedSelector('selectDevice', {
            ...mockSuiteDevice(),
        }),
        selectLanguage: notImplementedSelector('selectLanguage', 'en'),
        selectAddressDisplayType: notImplementedSelector(
            'selectAddressDisplayType',
            AddressDisplayOptions.CHUNKED,
        ),
        selectSelectedAccount: notImplementedSelector('selectSelectedAccount', {
            status: 'loaded',
            account: mockWalletAccount({
                symbol: 'btc',
                deviceState: '1@2:3',
                descriptor: asAccountDescriptor('btc1'),
            }),
        } as SelectedAccountLoaded),
        selectSelectedAccountStatus: notImplementedSelector(
            'selectSelectedAccountStatus',
            'loaded',
        ),
        selectIsSuiteSyncEnabled: notImplementedSelector('selectIsLocalFirstStorageEnabled', false),
        selectIsWindowVisible: notImplementedSelector('selectIsWindowVisible', true),
        selectTradingEnvironment: notImplementedSelector('selectTradingEnvironment', 'localhost'),
        selectIsViewOnlyByDefaultEnabled: notImplementedSelector(
            'selectIsViewOnlyByDefaultEnabled',
            true,
        ),
        selectThpSettings: notImplementedSelector('selectThpSettings', {
            pairingMethods: ['CodeEntry'],
        }),
        selectAllowPrerelease: notImplementedSelector('selectAllowPrerelease', false),
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
    },
};
