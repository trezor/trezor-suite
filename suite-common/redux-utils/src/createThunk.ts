import {
    AsyncThunkOptions,
    AsyncThunkPayloadCreator,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

import { ExtraDependencies } from './extraDependenciesType';

export const createThunk = <TPayload = void, TReturn = void>(
    typePrefix: string,
    thunk: AsyncThunkPayloadCreator<TReturn, TPayload, { state: any; extra: ExtraDependencies }>,
    options?: AsyncThunkOptions<TPayload>,
) => createAsyncThunkReduxToolkit(typePrefix, thunk, options);
