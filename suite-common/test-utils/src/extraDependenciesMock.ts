import { createAction } from '@reduxjs/toolkit';

import {
    EncryptableBranded,
    EncryptedHex,
    PlatformEncryption,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import {
    type ExtraDependencies,
    type LocationPushState,
    type To,
    createThunk,
} from '@suite-common/redux-utils';
import type { SuiteSync } from '@suite-common/suite-sync-types';
import { ReportSecurityCheckProps, Route } from '@suite-common/suite-types';
import { AddressDisplayOptions, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { ok } from '@trezor/type-utils';

import { testMocks } from './mocks';

const mockedConsoleAlreadyPrinted: string[] = [];

const mockedConsoleLog = (...args: any) => {
    // we don't want to see console.log in tests because it's too noisy
    if (process.env.NODE_ENV !== 'test' && !mockedConsoleAlreadyPrinted.includes(args[0])) {
        // eslint-disable-next-line no-console
        console.log(...args);

        // print every log only once
        mockedConsoleAlreadyPrinted.push(args[0]);
    }
};

export const mockAction = (type: string): any =>
    createAction<any>(`@mocked/extraDependency/action/notImplemented/${type}`, (payload: any) => {
        mockedConsoleLog(`Calling not implemented action ${type} with payload: `, payload);

        return { payload };
    });

export const mockThunk = (type: string) =>
    createThunk(`@mocked/extraDependency/notImplemented/${type}`, (thunkPayload: any) => {
        mockedConsoleLog(`Calling not implemented thunk: ${type} and payload: `, thunkPayload);

        return thunkPayload;
    });

export const mockOriginalReduxThunk = (type: string) => () => (thunkPayload: any) => {
    mockedConsoleLog(`Calling not implemented thunk: ${type} and payload: `);

    return thunkPayload;
};

export const mockSelector =
    <TReturn>(name: string, mockedReturnValue: TReturn, selectorArgs: any = {}) =>
    () => {
        mockedConsoleLog(
            `Calling not implemented selector "${name}" with mocked value: `,
            mockedReturnValue,
            ' and args: ',
            selectorArgs,
        );

        return mockedReturnValue;
    };

export const mockActionType = (type: string) =>
    `@mocked/extraDependency/actionType/notImplemented/${type}`;

export const mockReducer = (name: string) => (state: any, action: any) => {
    mockedConsoleLog(`Calling not implemented reducer "${name}" with action: `, action);

    return state;
};

const suiteSyncMock: SuiteSync = {
    changeRelayUrl: () => Promise.resolve(),
    turnOnSuiteSyncForWallet: () => Promise.resolve(ok()),
    turnOffSuiteSyncForWallet: () => Promise.resolve(),
    turnOnSuiteSync: () => Promise.resolve(),
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

export const extraDependenciesMock: ExtraDependencies = {
    thunks: {
        cardanoValidatePendingTxOnBlock: mockThunk('validatePendingTxOnBlock'),
        fetchAndSaveMetadata: mockThunk('fetchAndSaveMetadata'),
        initMetadata: mockThunk('initMetadata'),
        addAccountMetadata: mockThunk('addAccountMetadata'),
        forgetBluetoothDevice: mockThunk('forgetBluetoothDevice'),
    },
    services: {
        suiteSync: suiteSyncMock,
        platformEncryption: platformEncryptionMock,
    },
    selectors: {
        selectTokenDefinitionsEnabledNetworks: mockSelector(
            'selectTokenDefinitonsEnabledNetworks',
            ['eth'],
        ),
        selectDebugSettings: mockSelector('selectDebugSettings', {
            checkFirmwareAuthenticity: false,
            showDebugMenu: false,
            transports: [],
        }),
        selectDesktopBinDir: mockSelector('selectDesktopBinDir', '/bin'),
        selectRouterApp: mockSelector('selectRouterApp', ''),
        selectRoute: mockSelector('selectRoute', {} as Route),
        selectMetadata: mockSelector('selectMetadata', {}),
        selectDevice: mockSelector('selectDevice', {
            ...testMocks.getSuiteDevice(),
        }),
        selectLanguage: mockSelector('selectLanguage', 'en'),
        selectAddressDisplayType: mockSelector(
            'selectAddressDisplayType',
            AddressDisplayOptions.CHUNKED,
        ),
        selectSelectedAccount: mockSelector('selectSelectedAccount', {
            status: 'loaded',
            account: testMocks.getWalletAccount(),
        } as SelectedAccountLoaded),
        selectSelectedAccountStatus: mockSelector('selectSelectedAccountStatus', 'loaded'),
        selectIsSuiteSyncEnabled: mockSelector('selectIsLocalFirstStorageEnabled', false),
        selectIsWindowVisible: mockSelector('selectIsWindowVisible', true),
        selectTradingEnvironment: mockSelector('selectTradingEnvironment', 'localhost'),
        selectIsViewOnlyByDefaultEnabled: mockSelector('selectIsViewOnlyByDefaultEnabled', true),
        selectThpSettings: mockSelector('selectThpSettings', { pairingMethods: ['CodeEntry'] }),
    },
    actions: {
        setAccountAddMetadata: mockAction('setAccountAddMetadata'),
        lockDevice: mockAction('lockDevice'),
        onModalCancel: mockAction('onModalCancel'),
        openModal: mockAction('openModal'),
    },
    actionTypes: {
        storageLoad: mockActionType('storageLoad'),
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
    },
    reducers: {
        storageLoadBlockchain: mockReducer('storageLoadBlockchain'),
        storageLoadExplorer: mockReducer('storageLoadExplorer'),
        storageLoadAccounts: mockReducer('storageLoadAccounts'),
        storageLoadTransactions: mockReducer('storageLoadTransactions'),
        storageLoadHistoricRates: mockReducer('storageLoadHistoricRates'),
        setDeviceMetadataReducer: mockReducer('setDeviceMetadataReducer'),
        setDeviceMetadataPasswordsReducer: mockReducer('setDeviceMetadataPasswordsReducer'),
        storageLoadDevices: mockReducer('storageLoadDevices'),
        storageLoadFormDrafts: mockReducer('storageLoadFormDrafts'),
        storageLoadTokenManagement: mockReducer('storageLoadTokenManagement'),
        storageLoadWalletSettings: mockReducer('storageLoadWalletSettings'),
        storageLoadBioAuth: mockReducer('storageLoadBioAuth'),
    },
    utils: {
        saveAs: (data, fileName) =>
            console.warn(
                `Save data: ${data} into file: ${fileName}. Implementation on phone not ready.`,
            ),
        connectInitSettings: {
            debug: false,
            manifest: {
                email: 'info@trezor.io',
                appName: 'Trezor Suite',
                appUrl: '@suite-native/app',
            },
        },
        reportSecurityCheck: ({ level, checkType }: ReportSecurityCheckProps) =>
            console.warn(`Mock reporting ${checkType} check ${level} to Sentry.`),
    },
    routerServices: {
        getLocation: () => ({
            pathname: 'mocked_path',
            hash: 'mocked_hash',
            search: 'mocked_search',
        }),
        navigate: (to: To, state?: LocationPushState) =>
            console.warn(`Mock navigating to ${to} with state`, state),
    },
};
