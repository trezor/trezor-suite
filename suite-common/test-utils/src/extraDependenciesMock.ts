import { createAction } from '@reduxjs/toolkit';

import { ExtraDependencies, createThunk } from '@suite-common/redux-utils';
import { Route } from '@suite-common/suite-types';
import { AddressDisplayOptions, SelectedAccountLoaded } from '@suite-common/wallet-types';

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

export const extraDependenciesMock: ExtraDependencies = {
    thunks: {
        cardanoValidatePendingTxOnBlock: mockThunk('validatePendingTxOnBlock'),
        cardanoFetchTrezorData: mockThunk('fetchTrezorData'),
        fetchAndSaveMetadata: mockThunk('fetchAndSaveMetadata'),
        initMetadata: mockThunk('initMetadata'),
        addAccountMetadata: mockThunk('addAccountMetadata'),
        findLabelsToBeMovedOrDeleted: mockThunk('findLabelsToBeMovedOrDeleted'),
        moveLabelsForRbfAction: mockThunk('moveLabelsForRbfAction'),
        addWalletThunk: mockThunk('addWalletThunk'),
        openSwitchDeviceDialog: mockThunk('openSwitchDeviceDialog'),
    },
    selectors: {
        selectDevices: mockSelector('selectDevices', []),
        selectTokenDefinitionsEnabledNetworks: mockSelector(
            'selectTokenDefinitonsEnabledNetworks',
            ['eth'],
        ),
        selectIsPendingTransportEvent: mockSelector('selectIsPendingTransportEvent', false),
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
        selectDeviceDiscovery: mockSelector('selectDeviceDiscovery', undefined),
        selectAddressDisplayType: mockSelector(
            'selectAddressDisplayType',
            AddressDisplayOptions.CHUNKED,
        ),
        selectSelectedAccount: mockSelector('selectSelectedAccount', {
            status: 'loaded',
            account: testMocks.getWalletAccount(),
        } as SelectedAccountLoaded),
        selectSelectedAccountStatus: mockSelector('selectSelectedAccountStatus', 'loaded'),
        selectSuiteSettings: mockSelector('selectSuiteSettings', {
            defaultWalletLoading: 'standard',
        }),
        selectIsWindowVisible: mockSelector('selectIsWindowVisible', true),
        selectTradingEnvironment: mockSelector('selectTradingEnvironment', 'localhost'),
    },
    actions: {
        setAccountAddMetadata: mockAction('setAccountAddMetadata'),
        lockDevice: mockAction('lockDevice'),
        appChanged: mockAction('appChanged'),
        setSelectedDevice: mockAction('setSelectedDevice'),
        updateSelectedDevice: mockAction('updateSelectedDevice'),
        requestAuthConfirm: mockAction('requestAuthConfirm'),
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
        storageLoadDiscovery: mockReducer('storageLoadDiscovery'),
        setDeviceMetadataReducer: mockReducer('setDeviceMetadataReducer'),
        setDeviceMetadataPasswordsReducer: mockReducer('setDeviceMetadataPasswordsReducer'),
        storageLoadDevices: mockReducer('storageLoadDevices'),
        storageLoadFormDrafts: mockReducer('storageLoadFormDrafts'),
        storageLoadTokenManagement: mockReducer('storageLoadTokenManagement'),
        storageLoadWalletSettings: mockReducer('storageLoadWalletSettings'),
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
        reportCheckFail: (checkType, _contextData) =>
            console.warn(`Reporting ${checkType} check fail. Implementation on phone not ready.`),
    },
};
