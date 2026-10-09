import {
    type AsyncThunk,
    type AsyncThunkConfig,
    type AsyncThunkOptions,
    type AsyncThunkPayloadCreator,
    type ThunkDispatch,
    type UnknownAction,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

type CreateThunkDispatch = ThunkDispatch<any, any, UnknownAction>;

/**
 * Turns the small config declared by a thunk into the complete config Redux Toolkit needs.
 *
 * `void` means the thunk declared no state or injected dependencies. State becomes `unknown`, so it
 * cannot be passed to a selector, and `extra` becomes an object with no known keys. An omitted third
 * generic uses this same safe default.
 *
 * A supplied config keeps the fields the thunk declared. We replace `dispatch` with a broad thunk
 * dispatch so a parent can dispatch child thunks with their own state and dependency contracts. We
 * also make a missing `extra` explicitly empty instead of silently giving the thunk global tools.
 */
type ResolveThunkAPI<TThunkAPI> = [TThunkAPI] extends [void]
    ? { state: unknown; extra: Record<never, never>; dispatch: CreateThunkDispatch }
    : TThunkAPI extends AsyncThunkConfig
      ? Omit<TThunkAPI, 'dispatch' | 'extra'> & {
            extra: TThunkAPI extends { extra: infer TExtra } ? TExtra : Record<never, never>;
            dispatch: CreateThunkDispatch;
        }
      : never;

type CreateThunk = <
    TReturned = void,
    TThunkArg = void,
    TThunkAPI extends AsyncThunkConfig | void = void,
>(
    typePrefix: string,
    thunk: AsyncThunkPayloadCreator<TReturned, TThunkArg, ResolveThunkAPI<TThunkAPI>>,
    options?: AsyncThunkOptions<TThunkArg, ResolveThunkAPI<TThunkAPI>>,
) => AsyncThunk<TReturned, TThunkArg, ResolveThunkAPI<TThunkAPI>>;

export const createThunk: CreateThunk = createAsyncThunkReduxToolkit;
