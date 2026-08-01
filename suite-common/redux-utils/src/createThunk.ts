import {
    type AsyncThunk,
    type AsyncThunkConfig,
    type AsyncThunkOptions,
    type AsyncThunkPayloadCreator,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

import { type CustomThunkAPI } from './extraDependenciesType';

type ResolveThunkAPI<TThunkAPI> = [TThunkAPI] extends [void]
    ? CustomThunkAPI
    : Omit<CustomThunkAPI, keyof TThunkAPI> & TThunkAPI;

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
