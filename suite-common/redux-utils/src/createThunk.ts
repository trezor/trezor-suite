import {
    type AsyncThunkOptions,
    type AsyncThunkPayloadCreator,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

import { type CustomThunkAPI } from './extraDependenciesType';

export const createThunk = <TParams = void, TPayload = void, TThunkAPI = void>(
    typePrefix: string,
    thunk: AsyncThunkPayloadCreator<TParams, TPayload, TThunkAPI & CustomThunkAPI>,
    options?: AsyncThunkOptions<TPayload, TThunkAPI & CustomThunkAPI>,
) =>
    createAsyncThunkReduxToolkit<TParams, TPayload, TThunkAPI & CustomThunkAPI>(
        typePrefix,
        thunk,
        options,
    );
