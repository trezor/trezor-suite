import { createThunk, ExtraDependencies } from '@suite-common/redux-utils';
import { PROTO } from '@trezor/connect';
import { testMocks } from '@suite-common/test-utils';

// Uncomment this function when you it will be actually needed.
// import { createAction } from '@reduxjs/toolkit';
// const createEmptyAction = (type: string): any =>
//     createAction<any>(
//         `@suite-native/extraDependency/action/notImplemented/${type}`,
//         (payload: any) => {
//             // eslint-disable-next-line no-console
//             console.log(`Calling not implemented action ${type} with payload: `, payload);
//         },
//     );

const createEmptyThunk = (type: string) =>
    createThunk(`@suite-native/extraDependency/notImplemented/${type}`, (thunkPayload: any) => {
        // eslint-disable-next-line no-console
        console.log(`Calling not implemented thunk: ${type} and payload: `, thunkPayload);
    });

const createEmptySelector =
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

const createEmptyActionType = (type: string) =>
    `@suite-native/extraDependency/actionType/notImplemented/${type}`;

const createEmptyReducer = (name: string) => (_state: any, action: any) => {
    // eslint-disable-next-line no-console
    console.log(`Calling not implemented reducer "${name}" with action: `, action);
};

export const extraDependencies: ExtraDependencies = {
    thunks: {
        fetchAndUpdateAccount: createEmptyThunk('fetchAndUpdateAccount'),
        notificationsAddEvent: createEmptyThunk('notificationsAddEvent'),
    },
    selectors: {
        selectFeeInfo: (networkSymbol: any) =>
            createEmptySelector('selectFeeInfo', testMocks.fee, { networkSymbol }),
        selectAccounts: createEmptySelector('selectAccounts', []),
        selectDevices: createEmptySelector('selectDevices', []),
        selectBitcoinAmountUnit: createEmptySelector(
            'selectBitcoinAmountUnit',
            PROTO.AmountUnit.BITCOIN,
        ),
    },
    actions: {},
    actionTypes: {
        storageLoad: createEmptyActionType('storageLoad'),
    },
    reducers: {
        storageLoadBlockchain: createEmptyReducer('storageLoadBlockchain'),
    },
};
