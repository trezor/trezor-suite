import {
    type AsyncThunkOptions,
    type AsyncThunkPayloadCreator,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

// TODO: This dependency on the global ExtraDependencies type is bad, temporary, terrible, and
// disastrous. Remove it in follow-ups tracked by https://github.com/trezor/trezor-suite/issues/30770.
import { type CustomThunkAPI } from '@suite-common/redux-extra-dependencies';

/**
 * @description This function will ensure that there is only one ongoing promise for a given function with given arguments.
 * If there is an ongoing promise, it will return the same promise.
 */
function ensureSingleRunningInstance<T extends (...args: any[]) => Promise<any>>(func: T): T {
    const ongoingPromises = new Map<string, Promise<any>>();

    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
        // It's fine to hardcode first argument as key, because thunks has only one argument (second argument is thunkAPI which is not important for this case)
        const key = JSON.stringify(args[0]);
        if (!ongoingPromises.has(key)) {
            const promise = func.apply(this, args).finally(() => {
                ongoingPromises.delete(key);
            });
            ongoingPromises.set(key, promise);
        }

        return ongoingPromises.get(key) as ReturnType<T>;
    } as unknown as T;
}

export const createSingleInstanceThunk = <TParams = void, TPayload = void, TThunkAPI = void>(
    typePrefix: string,
    thunk: AsyncThunkPayloadCreator<TPayload, TParams, TThunkAPI & CustomThunkAPI>,
    options?: AsyncThunkOptions<TParams, TThunkAPI & CustomThunkAPI>,
) => {
    const wrappedPayloadCreator: AsyncThunkPayloadCreator<
        TPayload,
        TParams,
        TThunkAPI & CustomThunkAPI
    > = ensureSingleRunningInstance(thunk as any);

    return createAsyncThunkReduxToolkit<TPayload, TParams, TThunkAPI & CustomThunkAPI>(
        typePrefix,
        wrappedPayloadCreator,
        options,
    );
};
