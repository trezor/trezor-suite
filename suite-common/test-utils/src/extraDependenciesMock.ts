import { createAction } from '@reduxjs/toolkit';

import { createThunk, ExtraDependencies } from '@suite-common/redux-utils';
import { PROTO } from '@trezor/connect';

import { testMocks } from './mocks';

export const mockAction = (type: string): any =>
    createAction<any>(`@mocked/extraDependency/action/notImplemented/${type}`, (payload: any) => {
        // eslint-disable-next-line no-console
        console.log(`Calling not implemented action ${type} with payload: `, payload);
    });

export const mockThunk = (type: string) =>
    createThunk(`@mocked/extraDependency/notImplemented/${type}`, (thunkPayload: any) => {
        // eslint-disable-next-line no-console
        console.log(`Calling not implemented thunk: ${type} and payload: `, thunkPayload);
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

export const mockReducer = (name: string) => (_state: any, action: any) => {
    // eslint-disable-next-line no-console
    console.log(`Calling not implemented reducer "${name}" with action: `, action);
};

export const extraDependenciesMock: ExtraDependencies = {
    thunks: {
        notificationsAddEvent: mockThunk('notificationsAddEvent'),
    },
    selectors: {
        selectFeeInfo: (networkSymbol: any) =>
            mockSelector('selectFeeInfo', testMocks.fee, { networkSymbol }),
        selectDevices: mockSelector('selectDevices', []),
        selectBitcoinAmountUnit: mockSelector('selectBitcoinAmountUnit', PROTO.AmountUnit.BITCOIN),
    },
    actions: {
        addTransaction: mockAction('addTransaction'),
        removeTransaction: mockAction('removeTransaction'),
    },
    actionTypes: {
        storageLoad: mockActionType('storageLoad'),
        metadataAccountLoaded: mockActionType('metadataAccountLoaded'),
        metadataAccountAdd: mockActionType('metadataAccountAdd'),
    },
    reducers: {
        storageLoadBlockchain: mockReducer('storageLoadBlockchain'),
        storageLoadAccounts: mockReducer('storageLoadAccounts'),
    },
};
