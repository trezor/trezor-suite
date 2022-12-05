import { createAction } from '@reduxjs/toolkit';

import { createThunk, ExtraDependencies } from '@suite-common/redux-utils';
import { PROTO } from '@trezor/connect';

import { testMocks } from './mocks';

const mockedConsoleLog = (...args: any) => {
    // we don't want to see console.log in tests because it's too noisy
    if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.log(...args);
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
    },
    selectors: {
        selectFeeInfo: (networkSymbol: any) =>
            mockSelector('selectFeeInfo', testMocks.fee, { networkSymbol }),
        selectDevices: mockSelector('selectDevices', []),
        selectCurrentDevice: mockSelector('selectCurrentDevice', testMocks.getSuiteDevice()),
        selectBitcoinAmountUnit: mockSelector('selectBitcoinAmountUnit', PROTO.AmountUnit.BITCOIN),
        selectEnabledNetworks: mockSelector('selectEnabledNetworks', ['btc', 'test']),
        selectLocalCurrency: mockSelector('selectLocalCurrency', 'usd'),
        selectIsPendingTransportEvent: mockSelector('selectIsPendingTransportEvent', false),
    },
    actions: {
        setAccountLoadedMetadata: mockAction('setAccountLoadedMetadata'),
        setAccountAddMetadata: mockAction('setAccountAddMetadata'),
        setWalletSettingsLocalCurrency: mockAction('setWalletSettingsLocalCurrency'),
        changeWalletSettingsNetworks: mockAction('changeWalletSettingsNetworks'),
        lockDevice: mockAction('lockDevice'),
    },
    actionTypes: {
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        storageLoadBlockchain: mockReducer('storageLoadBlockchain'),
        storageLoadAccounts: mockReducer('storageLoadAccounts'),
        storageLoadTransactions: mockReducer('storageLoadTransactions'),
        storageLoadFiatRates: mockReducer('storageLoadAccounts'),
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
                appUrl: '@trezor/suite-native',
            },
        },
    },
};
