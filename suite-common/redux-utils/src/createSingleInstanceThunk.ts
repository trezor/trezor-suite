import {
    type AsyncThunk,
    type AsyncThunkConfig,
    type AsyncThunkOptions,
    type AsyncThunkPayloadCreator,
    type CreateAsyncThunkFunction,
    type ThunkDispatch,
    type UnknownAction,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

type CreateSingleInstanceThunkDispatch = ThunkDispatch<any, any, UnknownAction>;

type ResolveSingleInstanceThunkAPIRaw<TThunkAPI> = [TThunkAPI] extends [void]
    ? {
          state: unknown;
          extra: Record<never, never>;
          dispatch: CreateSingleInstanceThunkDispatch;
      }
    : TThunkAPI extends AsyncThunkConfig
      ? Omit<TThunkAPI, 'dispatch' | 'extra'> & {
            extra: TThunkAPI extends { extra: infer TExtra } ? TExtra : Record<never, never>;
            dispatch: CreateSingleInstanceThunkDispatch;
        }
      : never;

type ResolveSingleInstanceThunkAPI<TThunkAPI> = {
    [TKey in keyof ResolveSingleInstanceThunkAPIRaw<TThunkAPI>]: ResolveSingleInstanceThunkAPIRaw<TThunkAPI>[TKey];
};

/**
 * @description This function will ensure that there is only one ongoing promise for a given function with given arguments.
 * If there is an ongoing promise, it will return the same promise.
 */
function ensureSingleRunningInstance<TPayload, TParams, TThunkAPI extends AsyncThunkConfig>(
    func: AsyncThunkPayloadCreator<TPayload, TParams, TThunkAPI>,
): AsyncThunkPayloadCreator<TPayload, TParams, TThunkAPI> {
    const ongoingPromises = new Map<string, Promise<unknown>>();

    return ((params, thunkAPI) => {
        // The first argument is the key because an RTK thunk accepts exactly one params argument.
        const key = JSON.stringify(params);
        if (!ongoingPromises.has(key)) {
            const promise = Promise.resolve(func(params, thunkAPI)).finally(() => {
                ongoingPromises.delete(key);
            });
            ongoingPromises.set(key, promise);
        }

        return ongoingPromises.get(key)!;
    }) as AsyncThunkPayloadCreator<TPayload, TParams, TThunkAPI>;
}

export const createSingleInstanceThunk = <
    TParams = void,
    TPayload = void,
    TThunkAPI extends AsyncThunkConfig | void = void,
>(
    typePrefix: string,
    thunk: AsyncThunkPayloadCreator<TPayload, TParams, ResolveSingleInstanceThunkAPI<TThunkAPI>>,
    options?: AsyncThunkOptions<TParams, ResolveSingleInstanceThunkAPI<TThunkAPI>>,
): AsyncThunk<TPayload, TParams, ResolveSingleInstanceThunkAPI<TThunkAPI>> => {
    const wrappedPayloadCreator = ensureSingleRunningInstance<
        TPayload,
        TParams,
        ResolveSingleInstanceThunkAPI<TThunkAPI>
    >(thunk);

    const createTypedThunk: CreateAsyncThunkFunction<ResolveSingleInstanceThunkAPI<TThunkAPI>> =
        createAsyncThunkReduxToolkit;

    return createTypedThunk<TPayload, TParams>(typePrefix, wrappedPayloadCreator, options);
};
