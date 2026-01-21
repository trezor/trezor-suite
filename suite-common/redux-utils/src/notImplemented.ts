import { createAction } from '@reduxjs/toolkit';

import { createThunk } from './createThunk';

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

export const notImplementedAction = (type: string): any =>
    createAction<any>(`notImplemented/${type}`, (payload: any) => {
        mockedConsoleLog(`Calling not implemented action ${type} with payload: `, payload);

        return { payload };
    });

export const notImplementedThunk = (type: string) =>
    createThunk(`notImplemented/${type}`, (thunkPayload: any) => {
        mockedConsoleLog(`Calling not implemented thunk: ${type} and payload: `, thunkPayload);

        return thunkPayload;
    });

export const notImplementedOriginalReduxThunk = (type: string) => () => (thunkPayload: any) => {
    mockedConsoleLog(`Calling not implemented thunk: ${type} and payload: `);

    return thunkPayload;
};

export const notImplementedSelector =
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

export const notImplementedActionType = (type: string) => `actionType/notImplemented/${type}`;

export const notImplementedReducer = (name: string) => (state: any, action: any) => {
    mockedConsoleLog(`Calling not implemented reducer "${name}" with action: `, action);

    return state;
};
