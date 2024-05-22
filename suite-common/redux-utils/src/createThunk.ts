import {
    AsyncThunkOptions,
    AsyncThunkPayloadCreator,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

import { ExtraDependencies } from './extraDependenciesType';

type CustomThunkAPI = {
    state: any;
    extra: ExtraDependencies;
};

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
