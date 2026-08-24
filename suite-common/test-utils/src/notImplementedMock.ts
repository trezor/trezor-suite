import { createAction } from '@reduxjs/toolkit';

import { asGetter } from '@suite-common/dependency-injection';

const loggedMessages: string[] = [];

const logOnceOutsideTests = (...args: any[]) => {
    if (process.env.NODE_ENV === 'test' || loggedMessages.includes(args[0])) {
        return;
    }

    // eslint-disable-next-line no-console
    console.log(...args);
    loggedMessages.push(args[0]);
};

export const notImplementedAction = (type: string): any =>
    createAction<any>(`notImplemented/${type}`, (payload: any) => {
        logOnceOutsideTests(`Calling not implemented action ${type} with payload: `, payload);

        return { payload };
    });

export const notImplementedThunk = (type: string) => (thunkPayload: any) => () => {
    logOnceOutsideTests(`Calling not implemented thunk: ${type} and payload: `, thunkPayload);

    return thunkPayload;
};

export const notImplementedGetter = <TReturn>(
    name: string,
    mockedReturnValue: TReturn,
    getterArgs: any = {},
) =>
    asGetter(() => {
        logOnceOutsideTests(
            `Calling not implemented getter "${name}" with mocked value: `,
            mockedReturnValue,
            ' and args: ',
            getterArgs,
        );

        return mockedReturnValue;
    });

export const notImplementedActionType = (type: string) => `actionType/notImplemented/${type}`;

export const notImplementedReducer = (name: string) => (state: any, action: any) => {
    logOnceOutsideTests(`Calling not implemented reducer "${name}" with action: `, action);

    return state;
};
