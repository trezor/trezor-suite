import { createAction } from '@reduxjs/toolkit';

import { createThunk, ExtraDependencies } from '@suite-common/redux-utils';
import { PROTO } from '@trezor/connect';

import { testMocks } from './mocks';

export const mockAction = (type: string): any =>
    createAction<any>(`@mocked/extraDependency/action/notImplemented/${type}`, (payload: any) => {
        // eslint-disable-next-line no-console
        console.log(`Calling not implemented action ${type} with payload: `, payload);
        return { payload };
    });

export const mockThunk = (type: string) =>
    createThunk(`@mocked/extraDependency/notImplemented/${type}`, (thunkPayload: any) => {
        // eslint-disable-next-line no-console
        console.log(`Calling not implemented thunk: ${type} and payload: `, thunkPayload);
        return thunkPayload;
    });

export const mockSelector =
    <TReturn>(name: string, mockedReturnValue: TReturn, selectorArgs: any = {}) =>
    () => {
        // eslint-disable-next-line no-console
        console.log(
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
    // eslint-disable-next-line no-console
    console.log(`Calling not implemented reducer "${name}" with action: `, action);
    return state;
};

export const extraDependenciesMock: ExtraDependencies = {
    thunks: {
        notificationsAddEvent: mockThunk('notificationsAddEvent'),
        validatePendingTxOnBlock: mockThunk('validatePendingTxOnBlock'),
        fetchTrezorPools: mockThunk('fetchTrezorPools'),
    },
    selectors: {
        selectFeeInfo: (networkSymbol: any) =>
            mockSelector('selectFeeInfo', testMocks.fee, { networkSymbol }),
        selectDevices: mockSelector('selectDevices', []),
        selectBitcoinAmountUnit: mockSelector('selectBitcoinAmountUnit', PROTO.AmountUnit.BITCOIN),
        selectEnabledNetworks: mockSelector('selectEnabledNetworks', []),
        selectLocalCurrency: mockSelector('selectLocalCurrency', 'usd'),
        selectBlockchain: mockSelector('selectBlockchain', testMocks.mockedBlockchainNetworks),
        selectIsPendingTransportEvent: mockSelector('selectIsPendingTransportEvent', false),
    },
    actions: {
        setAccountLoadedMetadata: mockAction('setAccountLoadedMetadata'),
        setAccountAddMetadata: mockAction('setAccountAddMetadata'),
        setWalletSettingsLocalCurrency: mockAction('setWalletSettingsLocalCurrency'),
        changeWalletSettingsNetworks: mockAction('changeWalletSettingsNetworks'),
        blockchainConnected: mockAction('blockchainConnected'),
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
            debug: true,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite-native',
            },
        },
    },
};
