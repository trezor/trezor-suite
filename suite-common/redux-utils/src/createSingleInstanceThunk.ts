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

/**
 * Turns the short permissions written by a thunk into the complete permissions Redux Toolkit
 * needs. Think of `TThunkAPI` as a permission card: it says which Redux state and injected tools
 * the thunk is allowed to use.
 *
 * `[TThunkAPI] extends [void]` asks whether the caller supplied no permission card at all. The
 * square brackets are important. Without them, TypeScript may check pieces of a union separately
 * and combine the answers into a surprising type. The brackets make TypeScript answer the question
 * once for the whole type.
 *
 * When the caller supplies `void`, the thunk gets deliberately limited permissions:
 *
 * - The `state: unknown` field means that Redux has some state, but the thunk is not allowed to
 *   assume its shape or pass it to a selector.
 * - The `extra: Record<never, never>` field means that no injected dependency names exist, so
 *   reading something such as `extra.services` is a type error.
 * - The `dispatch` field stays broad because a parent thunk must be able to dispatch a child thunk
 *   with its own, different permission card.
 *
 * When the caller supplies a Redux Toolkit config object, we keep its declared fields, including
 * `state`, error payloads, and action metadata. We remove `dispatch` and `extra` first and then add
 * safe versions back. A declared `extra` type is preserved; a missing one becomes the same empty
 * dependency object used by the `void` branch. Replacing `dispatch` avoids making a parent thunk
 * pretend that every child thunk has exactly the same state and dependencies.
 *
 * The final `never` means that any other input is impossible. The public generic is already limited
 * to `AsyncThunkConfig | void`, but keeping this fallback prevents an unsupported value from quietly
 * turning into a usable thunk API if that constraint changes later.
 */
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

/**
 * Copies the fields from the raw result into a plain object type. The raw conditional above is like
 * an unfinished formula in TypeScript's memory. Redux Toolkit's generic overloads struggle to
 * compare that formula with `AsyncThunkConfig`. Copying every field makes TypeScript calculate the
 * result now, while preserving exactly the same permissions. This changes types only and produces
 * no JavaScript at runtime.
 */
type ResolveSingleInstanceThunkAPI<TThunkAPI> = {
    [
        TKey in keyof ResolveSingleInstanceThunkAPIRaw<TThunkAPI>
    ]: ResolveSingleInstanceThunkAPIRaw<TThunkAPI>[TKey];
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
