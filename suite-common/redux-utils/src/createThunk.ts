import {
    type AsyncThunk,
    type AsyncThunkConfig,
    type AsyncThunkOptions,
    type AsyncThunkPayloadCreator,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

import { type CustomThunkAPI } from './extraDependenciesType';

type DefaultThunkAPI = { readonly __defaultThunkAPI: unique symbol };

type ResolveThunkAPI<TThunkAPI> = [TThunkAPI] extends [DefaultThunkAPI]
    ? CustomThunkAPI
    : [TThunkAPI] extends [void]
      ? { state: unknown; extra: Record<never, never> }
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
