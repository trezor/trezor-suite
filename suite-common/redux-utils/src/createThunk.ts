import {
    type AsyncThunk,
    type AsyncThunkConfig,
    type AsyncThunkOptions,
    type AsyncThunkPayloadCreator,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

// TODO: This dependency on the global ExtraDependencies type is bad, temporary, terrible, and
// disastrous. Remove it in follow-ups tracked by https://github.com/trezor/trezor-suite/issues/30770.
import { type CustomThunkAPI } from '@suite-common/redux-extra-dependencies';

type DefaultThunkAPI = { readonly __defaultThunkAPI: unique symbol };

type ResolveThunkAPI<TThunkAPI> = [TThunkAPI] extends [DefaultThunkAPI]
    ? CustomThunkAPI
    : [TThunkAPI] extends [void]
      ? { state: unknown; extra: Record<never, never> }
      : TThunkAPI extends { state: unknown }
        ? Omit<CustomThunkAPI, keyof TThunkAPI | 'extra'> &
              TThunkAPI & {
                  extra: TThunkAPI extends { extra: infer TExtra } ? TExtra : Record<never, never>;
              }
        : Omit<CustomThunkAPI, keyof TThunkAPI> & TThunkAPI;

type CreateThunk = <
    TReturned = void,
    TThunkArg = void,
    TThunkAPI extends AsyncThunkConfig | void | DefaultThunkAPI = DefaultThunkAPI,
>(
    typePrefix: string,
    thunk: AsyncThunkPayloadCreator<TReturned, TThunkArg, ResolveThunkAPI<TThunkAPI>>,
    options?: AsyncThunkOptions<TThunkArg, ResolveThunkAPI<TThunkAPI>>,
) => AsyncThunk<TReturned, TThunkArg, ResolveThunkAPI<TThunkAPI>>;

export const createThunk: CreateThunk = createAsyncThunkReduxToolkit;
