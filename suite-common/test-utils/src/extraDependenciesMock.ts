import { createAction } from '@reduxjs/toolkit';

import { createThunk, ExtraDependencies } from '@suite-common/redux-utils';
import { PROTO } from '@trezor/connect';

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
        cardanoFetchTrezorPools: mockThunk('fetchTrezorPools'),
        fetchAndSaveMetadata: mockThunk('fetchAndSaveMetadata'),
        initMetadata: mockThunk('initMetadata'),
    },
    selectors: {
        selectFeeInfo: (networkSymbol: any) =>
            mockSelector('selectFeeInfo', testMocks.fee, { networkSymbol }),
        selectDevices: mockSelector('selectDevices', []),
        selectBitcoinAmountUnit: mockSelector('selectBitcoinAmountUnit', PROTO.AmountUnit.BITCOIN),
        selectEnabledNetworks: mockSelector('selectEnabledNetworks', ['btc', 'test']),
        selectLocalCurrency: mockSelector('selectLocalCurrency', 'usd'),
        selectIsPendingTransportEvent: mockSelector('selectIsPendingTransportEvent', false),
        selectDebugSettings: mockSelector('selectDebugSettings', {
            checkFirmwareAuthenticity: false,
            coinjoinAllowNoTor: false,
            showDebugMenu: false,
            transports: [],
        }),
        selectDesktopBinDir: mockSelector('selectDesktopBinDir', '/bin'),
        selectRouterApp: mockSelector('selectRouterApp', ''),
        selectMetadata: mockSelector('selectMetadata', {}),
        selectDevice: mockSelector('selectDevice', {
            ...testMocks.getSuiteDevice(),
        }),
        selectDeviceDiscovery: mockSelector('selectDeviceDiscovery', undefined),
        selectCheckFirmwareAuthenticity: mockSelector('selectCheckFirmwareAuthenticity', false),
    },
    actions: {
        setAccountAddMetadata: mockAction('setAccountAddMetadata'),
        setWalletSettingsLocalCurrency: mockAction('setWalletSettingsLocalCurrency'),
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
        addButtonRequest: mockActionType('addButtonRequest'),
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
    },
    reducers: {
        storageLoadBlockchain: mockReducer('storageLoadBlockchain'),
        storageLoadAccounts: mockReducer('storageLoadAccounts'),
        storageLoadTransactions: mockReducer('storageLoadTransactions'),
        storageLoadFirmware: mockReducer('storageLoadFirmware'),
        storageLoadDiscovery: mockReducer('storageLoadDiscovery'),
        addButtonRequestFirmware: mockReducer('addButtonRequestFirmware'),
        setDeviceMetadataReducer: mockReducer('setDeviceMetadataReducer'),
        storageLoadDevices: mockReducer('storageLoadDevices'),
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
                appUrl: '@suite-native/app',
            },
        },
    },
};
